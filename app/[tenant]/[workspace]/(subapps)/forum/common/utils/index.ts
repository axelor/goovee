import {getTranslation} from '@/locale/server';
import {findGooveeUserByEmail} from '@/orm/partner';
import {manager, type Tenant} from '@/tenant';
import {PortalWorkspace, User} from '@/types';
import {getPageInfo, getSkipInfo} from '@/utils';

// ---- LOCAL IMPORTS ---- //
import {Post} from '@/subapps/forum/common/types/forum';

export const filterPrivateQuery = async (user: any, tenantId: any) => {
  const OPEN_RECORD_FILTERS = `COALESCE(forumGroup.is_private, false) IS FALSE`;

  if (!user) {
    return `AND ${OPEN_RECORD_FILTERS}`;
  }

  const partner = await findGooveeUserByEmail(user.email, tenantId);

  if (!partner) {
    throw new Error('Unauthorized');
  }

  const partnerCategory = partner?.partnerCategory;
  const PRIVATE_FILTERS = `
        forumGroup.is_private = TRUE 
        AND (
              forumGroup.id IN (
                SELECT portal_forum_group_partner_set.portal_forum_group
                FROM portal_forum_group_partner_set
                WHERE portal_forum_group_partner_set.partner_set = ${partner?.id}
              )
            ${
              partnerCategory
                ? `OR 
                    forumGroup.id IN (
                      SELECT portal_forum_group_partner_category_set.portal_forum_group
                      FROM portal_forum_group_partner_category_set
                      WHERE portal_forum_group_partner_category_set.partner_category_set = ${partnerCategory.id}
                    )
                      `
                : ''
            }
            )
    `;
  return `AND (${OPEN_RECORD_FILTERS} OR (${PRIVATE_FILTERS}))`;
};

export async function getPopularQuery({
  page,
  limit,
  workspaceID,
  groupIDs,
  ids,
  search,
  tenantId,
  user,
  archived = false,
  memberGroupIDs = [],
}: {
  page?: string | number;
  limit?: number;
  workspaceID: PortalWorkspace['id'];
  groupIDs?: any[];
  ids?: Array<Post['id']> | undefined;
  search?: string | undefined;
  tenantId: Tenant['id'];
  user?: User;
  archived?: boolean;
  memberGroupIDs?: Array<string>;
}) {
  if (!workspaceID) {
    return {
      error: true,
      message: await getTranslation({tenant: tenantId}, 'Invalid workspace'),
    };
  }
  const client = await manager.getClient(tenantId);

  const skip = getSkipInfo(limit, page);
  const whereClause = `WHERE forumGroup.workspace = ${workspaceID}
          ${groupIDs?.length ? `AND post.forum_group IN (${groupIDs.join(', ')})` : ''}
          ${ids?.length ? `AND post.id IN (${ids.join(', ')})` : ''}
          ${search ? `AND post.title LIKE '%${search}%'` : ''}
          ${await filterPrivateQuery(user, tenantId)}
          ${
            archived
              ? 'AND post.archived = true AND forumGroup.archived = true'
              : 'AND COALESCE(post.archived, false) IS FALSE AND COALESCE(forumGroup.archived, false ) IS FALSE'
          }
         `;

  const posts: any = await client
    .$raw(
      `WITH 
    postData AS (
        SELECT 
            post.id AS postId, 
            post.title, 
            forumGroup.id AS forumGroupId, 
            forumGroup.name AS forumGroupName, 
            forumGroup.image AS forumGroupImage, 
            JSON_BUILD_OBJECT(
                'id', forumGroup.id,
                'name', forumGroup.name,
                'image', JSON_BUILD_OBJECT(  
                    'id', forumGroup.image
                )
            ) AS forumGroupJson,
            post.content, 
            post.created_on AS createdOn,
            post.author,
            author.simple_full_name AS authorSimpleFullName,
            author.picture AS authorPicture,
            post.post_datet AS postDateT
        FROM portal_forum_post AS post
        LEFT JOIN portal_forum_group AS forumGroup 
            ON post.forum_group = forumGroup.id
        LEFT JOIN base_partner AS author 
            ON post.author = author.id
        LEFT JOIN meta_file AS metaFile 
            ON author.picture = metaFile.id
        ${whereClause}
    ),

    commentData AS (
        SELECT 
            commentList.related_id AS postId,
            COUNT(*) AS totalComments
        FROM mail_message AS commentList
        WHERE commentList.related_model = 'com.axelor.apps.portal.db.ForumPost'
        GROUP BY commentList.related_id
    ), 

    attachmentData AS (
        SELECT 
            attachmentList.forum_post AS postId,
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'id', attachmentList.id,
                    'title', attachmentList.title,
                    'metaFile', JSON_BUILD_OBJECT(
                        'id', metaFile.id,
                        'fileName', metaFile.file_name,
                        'fileType', metaFile.file_type
                    )
                )
            ) AS attachmentListJson
        FROM portal_post_attachment AS attachmentList
        LEFT JOIN meta_file AS metaFile 
            ON attachmentList.meta_file = metaFile.id
        GROUP BY attachmentList.forum_post
    ),
        
    authorData AS (
        SELECT 
            author.id AS id, 
            JSON_BUILD_OBJECT(
                'id', author.id,
                'simpleFullName', author.simple_full_name,
                'picture', JSON_BUILD_OBJECT(
                    'id', metaFile.id
                )
            ) AS authorJson
        FROM base_partner AS author
        LEFT JOIN meta_file AS metaFile 
            ON author.picture = metaFile.id
    ),

    totalCount AS (
        SELECT COUNT(*) AS _count
        FROM portal_forum_post AS post
        LEFT JOIN portal_forum_group AS forumGroup 
            ON post.forum_group = forumGroup.id
        LEFT JOIN base_partner AS author 
            ON post.author = author.id
        LEFT JOIN meta_file AS metaFile 
            ON author.picture = metaFile.id
        ${whereClause}
    )

    SELECT 
        pd.postId AS "id",
        pd.createdOn AS "createdOn",
        pd.title,
        pd.content,
        pd.postDateT AS "postDateT",
        COALESCE(pd.forumGroupJson, '{}') AS "forumGroup",
        COALESCE(authorD.authorJson, '{}') AS author,
        COALESCE(ad.attachmentListJson, '[]') AS "attachmentList", 
        COALESCE(cd.totalComments, 0) AS "totalComments",
        (SELECT _count FROM totalCount) AS "_count"
    FROM postData AS pd
    LEFT JOIN commentData AS cd 
        ON pd.postId = cd.postId
    LEFT JOIN attachmentData AS ad 
        ON pd.postId = ad.postId
    LEFT JOIN authorData AS authorD 
        ON pd.author = authorD.id
    ORDER BY COALESCE(cd.totalComments, 0) DESC, pd.postDateT DESC
    LIMIT $1
    OFFSET $2
        `,
      limit,
      skip,
    )
    .then((posts: any) => {
      return posts.map((post: any) => {
        return {
          ...post,
          isMember: memberGroupIDs.includes(String(post.forumGroup?.id)),
        };
      });
    });

  const pageInfo = getPageInfo({
    count: posts?.[0]?._count,
    page,
    limit,
  });

  return {posts, pageInfo};
}

interface Element {
  [key: string]: any;
}

export const addProperties = ({
  element = {},
  key,
  value,
}: {
  element: Element;
  key: string;
  value: any;
}) => {
  if (!key) return element;

  const properties = element[key] || [];
  properties.push(value);
  element[key] = properties;
  return element;
};

export const getArchivedFilter = ({archived}: {archived: boolean}) => {
  return archived
    ? {archived: true}
    : {OR: [{archived: false}, {archived: null}]};
};
