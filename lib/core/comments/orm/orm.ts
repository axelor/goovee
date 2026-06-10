import type {QueryOptions} from '@goovee/orm';
import path from 'path';

// ---- CORE IMPORTS ---- //
import {ORDER_BY} from '@/constants';
import {AOSMailMessage} from '@/goovee/.generated/models';
import {t} from '@/locale/server';
import type {Client} from '@/goovee/.generated/client';
import {redeemUpload} from '@/lib/core/upload/staged-upload';
import type {ID} from '@/types';
import {sql} from '@/utils/template-string';

// ---- LOCAL IMPORTS ---- //
import {
  COMMENT_ATTACHMENT_PURPOSE,
  MAIL_MESSAGE_TYPE,
  SORT_TYPE,
} from '../constants';
import type {
  AddCommentProps,
  Comment,
  CommentAttachment,
  CommentField,
  FindCommentsData,
  FindCommentsProps,
  TrackingField,
} from '../types';
import {CommentSchema, CommentsSchema} from '../utils';
import {and} from '@/utils/orm';
import {getTotal} from '@/utils/pagination';

function getSelectFields({
  showRepliesInMainThread,
  trackingField,
  childConditions,
  commentField,
}: {
  showRepliesInMainThread?: boolean;
  childConditions?: Omit<QueryOptions<AOSMailMessage>, 'select'>;
  trackingField: TrackingField;
  commentField: CommentField;
}) {
  const commentFields = {
    [commentField]: true,
    [trackingField]: true,
    createdOn: true,
    partner: {
      picture: {id: true},
      simpleFullName: true,
      name: true,
      localization: {code: true},
    },
    mailMessageFileList: {select: {attachmentFile: {id: true, fileName: true}}},
    createdBy: {id: true, fullName: true},
  } as const;

  const select = {
    ...commentFields,
    ...(showRepliesInMainThread && {parentMailMessage: commentFields}),
    isPublicNote: true,
    childMailMessages: {...childConditions, select: commentFields} as {
      select: typeof commentFields;
    },
  };
  return select;
}

async function getPopularCommentsBySorting({
  skip = 0,
  limit,
  recordId,
  client,
  modelName,
  exclude,
  showRepliesInMainThread,
}: {
  recordId: ID;
  skip?: number;
  limit?: number;
  client: Client;
  modelName: string;
  exclude?: ID[];
  showRepliesInMainThread?: boolean;
}): Promise<FindCommentsData> {
  if (!recordId) {
    throw new Error(await t('RecordId is required'));
  }

  const params = [
    recordId, // $1
    limit, // $2
    skip, // $3
    modelName, // $4
  ];
  let query = client.$raw.bind(
    null,
    sql`
      WITH
        mailMessageFileListData AS (
          SELECT
            mailMessageFile.related_mail_message AS id,
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id',
                mailMessageFile.id::text,
                'version',
                mailMessageFile.version,
                'attachmentFile',
                JSON_BUILD_OBJECT(
                  'id',
                  metaFile.id::text,
                  'version',
                  metaFile.version,
                  'fileName',
                  metaFile.file_name
                )
              )
            ) AS mailMessageFileList
          FROM
            base_mail_message_file AS mailMessageFile
            LEFT JOIN meta_file AS metaFile ON mailMessageFile.attachment_file = metaFile.id
          GROUP BY
            mailMessageFile.related_mail_message
        ),
        comments AS (
          SELECT
            mail_message.id AS id,
            mail_message.version AS VERSION,
            mail_message.note AS note,
            mail_message.public_body AS publicBody,
            mail_message.created_on AS createdOn,
            mail_message.is_public_note AS isPublicNote,
            mail_message.parent AS parentComment,
            CASE
              WHEN author.id IS NOT NULL THEN JSON_BUILD_OBJECT(
                'id',
                author.id::text,
                'version',
                author.version,
                'fullName',
                author.full_name
              )
            END AS createdBy,
            CASE
              WHEN partner.id IS NOT NULL THEN JSON_BUILD_OBJECT(
                'id',
                partner.id::text,
                'version',
                partner.version,
                'picture',
                CASE
                  WHEN picture.id IS NOT NULL THEN JSON_BUILD_OBJECT(
                    'id',
                    picture.id::text,
                    'version',
                    picture.version
                  )
                END,
                'simpleFullName',
                partner.simple_full_name,
                'name',
                partner.name
              )
            END AS partner
          FROM
            mail_message
            LEFT JOIN auth_user AS author ON mail_message.created_by = author.id
            LEFT JOIN base_partner AS partner ON mail_message.partner = partner.id
            LEFT JOIN meta_file AS picture ON partner.picture = picture.id
          WHERE
            (
              mail_message.public_body IS NOT NULL
              OR mail_message.is_public_note = TRUE
            )
            AND mail_message.related_model = $4
            AND mail_message.archived IS NOT TRUE
            AND mail_message.related_id = $1 ${showRepliesInMainThread
              ? ''
              : 'AND mail_message.parent_mail_message IS NULL'} ${exclude &&
            exclude.length
              ? `AND mail_message.id NOT IN (${exclude.map((_, i) => '$' + (i + 1 + params.length)).join(',')})`
              : ''}
        ),
        childCommentsData AS (
          SELECT
            childComment.parent_mail_message AS parentId,
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id',
                childComment.id::text,
                'version',
                childComment.version,
                'note',
                childComment.note,
                'publicBody',
                childComment.public_body,
                'createdOn',
                childComment.created_on,
                'partner',
                CASE
                  WHEN childPartner.id IS NOT NULL THEN JSON_BUILD_OBJECT(
                    'id',
                    childPartner.id::text,
                    'version',
                    childPartner.version,
                    'picture',
                    CASE
                      WHEN picture.id IS NOT NULL THEN JSON_BUILD_OBJECT(
                        'id',
                        picture.id::text,
                        'version',
                        picture.version
                      )
                    END,
                    'simpleFullName',
                    childPartner.simple_full_name,
                    'name',
                    childPartner.name
                  )
                END,
                'createdBy',
                CASE
                  WHEN childAuthor.id IS NOT NULL THEN JSON_BUILD_OBJECT(
                    'id',
                    childAuthor.id::text,
                    'version',
                    childAuthor.version,
                    'fullName',
                    childAuthor.full_name
                  )
                END,
                'mailMessageFileList',
                COALESCE(mf.mailMessageFileList, '[]')
              )
              ORDER BY
                childComment.created_on ASC
            ) AS childMailMessages,
            COUNT(childComment.id) AS childCommentCount
          FROM
            mail_message AS childComment
            LEFT JOIN auth_user AS childAuthor ON childComment.created_by = childAuthor.id
            LEFT JOIN base_partner AS childPartner ON childComment.partner = childPartner.id
            LEFT JOIN meta_file AS picture ON childPartner.picture = picture.id
            LEFT JOIN mailMessageFileListData AS mf ON childComment.id = mf.id
          WHERE
            childComment.is_public_note = TRUE
            AND childComment.archived IS NOT TRUE
            AND childComment.related_model = $4
            AND childComment.related_id = $1
          GROUP BY
            childComment.parent_mail_message
        )
      SELECT
        c.id AS id,
        c.version AS VERSION,
        c.note,
        c.createdOn AS "createdOn",
        c.isPublicNote AS "isPublicNote",
        c.createdBy AS "createdBy",
        c.partner AS "partner",
        COALESCE(mf.mailMessageFileList, '[]') AS "mailMessageFileList",
        COALESCE(cc.childMailMessages, '[]') AS "childMailMessages",
        COALESCE(cc.childCommentCount, 0) AS "childCommentCount",
        COUNT(*) OVER () AS "_count",
        (
          SELECT
            COALESCE(SUM(cc.childCommentCount), 0)
          FROM
            childCommentsData cc
        ) AS "_threadCount"
      FROM
        comments AS c
        LEFT JOIN childCommentsData AS cc ON c.id = cc.parentId
        LEFT JOIN mailMessageFileListData AS mf ON c.id = mf.id
      ORDER BY
        COALESCE(cc.childCommentCount, 0) DESC,
        c.createdOn DESC
      LIMIT
        $2
      OFFSET
        $3
    `,
    ...params,
  );

  if (exclude?.length) {
    query = query.bind(null, ...exclude);
  }

  const comments: any = await query();

  return {
    comments: CommentsSchema.parse(comments || []),
    total: getTotal(comments || []), // only parent comments counts
    totalCommentThreadCount: Number(comments?.[0]?._threadCount), // total count of comments ( parent + child comments )
  };
}

type Attachment = {
  id: ID;
  description: string | null;
};

/**
 * Redeem pre-staged upload claims into `meta_file` ids. A user-supplied title
 * renames the stored file, keeping the staged file's extension.
 */
async function redeemAttachments({
  attachments,
  owner,
  client,
}: {
  attachments: CommentAttachment[];
  owner: ID;
  client: Client;
}): Promise<Attachment[]> {
  const redeemed: Attachment[] = [];

  for (const {token, title, description} of attachments) {
    const id = await redeemUpload({
      token,
      purpose: COMMENT_ATTACHMENT_PURPOSE,
      owner,
      client,
    });

    const metaFile = await client.aOSMetaFile.findOne({
      where: {id},
      select: {fileName: true},
    });
    if (metaFile) {
      const fileName = title
        ? `${title}${path.extname(metaFile.fileName ?? '')}`
        : undefined;
      if (fileName || description) {
        await client.aOSMetaFile.update({
          data: {
            id,
            version: metaFile.version,
            ...(fileName && {fileName}),
            ...(description && {description}),
          },
        });
      }
    }

    redeemed.push({id, description: description || null});
  }

  return redeemed;
}

export async function addComment(
  props: AddCommentProps,
): Promise<[Comment, Comment | undefined]> {
  const {
    recordId,
    modelName,
    userId,
    workspaceUserId,
    data,
    parentId,
    messageBody,
    client,
    subject,
    messageType = MAIL_MESSAGE_TYPE.comment,
    showRepliesInMainThread,
    trackingField,
    commentField,
  } = props;

  let parent;
  if (parentId) {
    parent = await client.aOSMailMessage.findOne({
      where: {
        id: {eq: parentId},
        relatedId: Number(recordId),
        OR: [{archived: false}, {archived: null}],
      },
      select: {id: true},
    });
    if (!parent) {
      throw new Error(await t('Invalid parent'));
    }
  }

  const attachments: Attachment[] = data?.attachments?.length
    ? await redeemAttachments({
        attachments: data.attachments,
        owner: userId,
        client,
      })
    : [];

  const timestamp = new Date();

  const body = JSON.stringify(messageBody);
  const response = await client.aOSMailMessage.create({
    data: {
      partner: {select: {id: userId}},
      relatedId: Number(recordId),
      relatedModel: modelName,
      [commentField]: data?.text,
      isPublicNote: true,
      createdOn: timestamp,
      updatedOn: timestamp,
      type: messageType,
      ...(parent && {parentMailMessage: {select: {id: parent.id}}}),
      ...(messageBody && {body, publicBody: body}),
      subject: subject,
      author: {select: {id: workspaceUserId}},
      createdBy: {select: {id: workspaceUserId}},
      //relatedName: TODO: Add this later
      ...(attachments.length > 0 && {
        mailMessageFileList: {
          create: attachments.map(attachment => ({
            description: attachment.description,
            attachmentFile: {select: {id: attachment.id}},
            createdOn: timestamp,
            updatedOn: timestamp,
          })),
        },
      }),
    },
    select: {id: true},
  });

  const comments = await client.aOSMailMessage.find({
    where: {id: {in: [response.id].concat(parent ? [parent.id] : [])}},
    select: getSelectFields({
      showRepliesInMainThread,
      trackingField,
      commentField,
    }),
  });

  const comment = CommentSchema.parse(comments.find(d => d.id === response.id));
  const parentComment =
    parent && CommentSchema.parse(comments.find(d => d.id === parent.id));

  return [comment, parentComment];
}

export async function findComments(
  props: FindCommentsProps,
): Promise<FindCommentsData> {
  const {
    recordId,
    modelName,
    limit,
    skip,
    sort,
    client,
    exclude,
    showRepliesInMainThread,
    trackingField,
    commentField,
  } = props;

  if (!recordId) {
    throw new Error(await t('RecordId is required.'));
  }

  let orderBy: any = null;
  switch (sort) {
    case SORT_TYPE.old:
      orderBy = {createdOn: ORDER_BY.ASC};
      break;
    case SORT_TYPE.popular:
      const results = await getPopularCommentsBySorting({
        recordId,
        modelName,
        skip,
        limit,
        client,
        exclude,
        showRepliesInMainThread,
      });

      return results;
    default:
      orderBy = {createdOn: ORDER_BY.DESC};
  }

  let comments = await client.aOSMailMessage.find({
    where: and<AOSMailMessage>([
      {
        relatedId: Number(recordId),
        relatedModel: modelName,
        OR: [{[trackingField]: {ne: null}}, {isPublicNote: true}],
      },
      {OR: [{archived: false}, {archived: null}]},
      exclude && exclude.length && {id: {notIn: exclude}},
      !showRepliesInMainThread && {parentMailMessage: {id: {eq: null}}},
    ]),
    orderBy,
    take: limit,
    ...(skip ? {skip} : {}),
    select: getSelectFields({
      trackingField,
      commentField,
      showRepliesInMainThread,
      childConditions: {
        orderBy,
        where: {
          OR: [{archived: false}, {archived: null}],
          relatedId: Number(recordId),
          relatedModel: modelName,
          isPublicNote: true,
        },
      },
    }),
  });

  comments = comments?.map(comment => {
    if (!comment.isPublicNote) return {...comment, note: undefined};
    return comment;
  });

  const totalCommentThreadCount = await client.aOSMailMessage.count({
    where: {
      AND: [
        {
          relatedId: Number(recordId),
          relatedModel: modelName,
          OR: [{publicBody: {ne: null}}, {isPublicNote: true}],
        },
        {OR: [{archived: false}, {archived: null}]},
      ],
    },
  });

  return {
    comments: CommentsSchema.parse(comments),
    total: Number(comments?.[0]?._count || comments?.length),
    totalCommentThreadCount: Number(totalCommentThreadCount),
  };
}

export async function isFileOfRecord({
  fileId,
  recordId,
  client,
}: {
  client: Client;
  recordId: ID;
  fileId: ID;
}): Promise<boolean> {
  if (!recordId) {
    throw new Error(await t('RecordId is required.'));
  }

  const comment = await client.aOSMailMessage.findOne({
    where: {
      relatedId: Number(recordId),
      mailMessageFileList: {attachmentFile: {id: fileId}},
      OR: [{archived: false}, {archived: null}],
    },
    select: {id: true},
  });
  return Boolean(comment);
}
