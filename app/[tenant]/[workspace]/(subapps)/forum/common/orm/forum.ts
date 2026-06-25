// ---- CORE IMPORTS ---- //
import {ORDER_BY} from '@/constants';
import {SORT_TYPE} from '@/comments';
import type {Client} from '@/goovee/.generated/client';
import {ID, User} from '@/types';
import type {PageInfo} from '@/types';
import {clone, getPageInfo} from '@/utils';
import {getSkip} from '@/utils/pagination';
import {WorkspaceLight} from '@/orm/workspace';
import {filterPrivate} from '@/orm/filter';

// ---- LOCAL IMPORTS ---- //
import {
  addProperties,
  getArchivedFilter,
  getPopularQuery,
  filterPrivateQuery,
} from '@/subapps/forum/common/utils';
import {
  Post,
  PostWithMembership,
  RecentlyActivePost,
} from '@/subapps/forum/common/types/forum';

export async function findGroups({
  workspaceURL,
  client,
  user,
  archived = false,
}: {
  workspaceURL: WorkspaceLight['url'];
  client: Client;
  user?: User;
  archived?: boolean;
}) {
  if (!workspaceURL) return [];

  const groups = await client.aOSPortalForumGroup.find({
    where: {
      workspace: {
        url: workspaceURL,
      },
      AND: [filterPrivate({user}), getArchivedFilter({archived})],
    },
    select: {
      name: true,
      image: {id: true},
    },
  });

  return groups;
}

export async function findGroupsByMembers({
  id = null,
  searchKey,
  orderBy,
  workspaceID,
  client,
  user,
  archived = false,
}: {
  id: ID | null;
  searchKey?: string;
  orderBy?: Record<string, unknown>;
  workspaceID: WorkspaceLight['id'];
  client: Client;
  user?: User;
  archived?: boolean;
}) {
  if (!workspaceID) return [];

  const whereClause = {
    member: {
      AND: [{id}, {id: {ne: null}}],
    },
    forumGroup: {
      workspace: {id: workspaceID},
      AND: [filterPrivate({user}), getArchivedFilter({archived})],
      ...(searchKey ? {name: {like: `%${searchKey}%`}} : {}),
    },
  };

  return await client.aOSPortalForumGroupMember
    .find({
      where: whereClause,
      orderBy,
      select: {
        forumGroup: {
          name: true,
          image: {
            id: true,
          },
        },
        isPin: true,
        notificationSelect: true,
      },
    })
    .then(clone);
}

export async function findUser({
  userId,
  client,
  archived = false,
}: {
  userId: ID | null | undefined;
  client: Client;
  archived?: boolean;
}) {
  if (!userId) {
    return null;
  }

  const archivedFilter = getArchivedFilter({archived});

  const user = await client.aOSPartner.findOne({
    where: {
      id: userId,
      ...archivedFilter,
    },
    select: {
      picture: {
        fileName: true,
        fileType: true,
        fileSize: true,
        filePath: true,
        sizeText: true,
      },
    },
  });
  return user;
}

export async function findPosts({
  sort = null,
  limit,
  page = 1,
  search = '',
  whereClause = {},
  workspaceID,
  groupIDs = [],
  client,
  ids,
  user,
  archived = false,
  memberGroupIDs = [],
}: {
  sort?: string | null;
  limit?: number;
  page?: string | number;
  search?: string | undefined;
  ids?: Array<Post['id']> | undefined;
  whereClause?: Record<string, unknown>;
  workspaceID: WorkspaceLight['id'];
  groupIDs?: ID[];
  client: Client;
  user?: User;
  archived?: boolean;
  memberGroupIDs?: Array<string>;
}): Promise<{posts: PostWithMembership[]; pageInfo: PageInfo}> {
  if (!workspaceID) {
    return {
      posts: [],
      pageInfo: getPageInfo({}),
    };
  }

  let orderBy: Record<string, string> | null = null;

  switch (sort) {
    case SORT_TYPE.old:
      orderBy = {postDateT: ORDER_BY.ASC};
      break;
    case SORT_TYPE.popular:
      const query = await getPopularQuery({
        page,
        limit,
        workspaceID,
        groupIDs,
        search,
        client,
        ids,
        user,
        archived,
        memberGroupIDs,
      });
      const {posts, pageInfo} = query;

      return {posts: posts as unknown as PostWithMembership[], pageInfo};

    default:
      orderBy = {postDateT: ORDER_BY.DESC};
  }

  const skip = limit ? getSkip(limit, page) : undefined;

  const archivedFilter = getArchivedFilter({archived});
  const whereClauseWithArchivedFilter = addProperties({
    element: whereClause,
    key: 'AND',
    value: archivedFilter,
  });

  const combinedWhereClause = {
    ...whereClauseWithArchivedFilter,
    forumGroup: {
      workspace: {
        id: workspaceID,
      },
      ...(groupIDs.length ? {id: {in: groupIDs}} : {}),
      ...(whereClause.forumGroup as object | undefined),
      AND: [filterPrivate({user}), archivedFilter],
    },
    ...(search
      ? {
          title: {
            like: `%${search}%`,
          },
        }
      : {}),
    ...(ids?.length ? {id: {in: ids}} : {}),
  };

  const posts = await client.aOSPortalForumPost
    .find({
      where: combinedWhereClause,
      orderBy,
      take: limit,
      ...(skip ? {skip} : {}),
      select: {
        title: true,
        forumGroup: {
          name: true,
          image: {
            fileName: true,
            fileType: true,
            fileSize: true,
            filePath: true,
            sizeText: true,
          },
        },
        postDateT: true,
        content: true,
        attachmentList: {
          select: {
            title: true,
            metaFile: {
              id: true,
              fileType: true,
              fileName: true,
            },
          },
        },
        author: {
          simpleFullName: true,
          picture: {
            fileName: true,
            fileType: true,
            fileSize: true,
            filePath: true,
            sizeText: true,
          },
        },
        createdOn: true,
      },
    })
    .then(posts => {
      const $posts = (posts as unknown as Post[])?.map(post => ({
        ...post,
        isMember: memberGroupIDs.includes(post.forumGroup?.id ?? ''),
      }));
      return clone($posts) as PostWithMembership[];
    })
    .catch(error => {
      console.error('error >>>', error);
      return [] as PostWithMembership[];
    });

  const pageInfo = getPageInfo({
    count: (posts?.[0] as {_count?: number} | undefined)?._count,
    page,
    limit,
  });

  return {posts, pageInfo};
}

export async function findPostsByGroupId({
  id,
  workspaceID,
  sort = null,
  limit,
  search = '',
  ids,
  client,
  user,
  memberGroupIDs = [],
}: {
  id: ID;
  workspaceID: string;
  sort?: string | null;
  limit?: number;
  search?: string | undefined;
  ids?: string[];
  client: Client;
  user?: User;
  memberGroupIDs?: Array<string>;
}) {
  const whereClause = {
    forumGroup: {
      id,
    },
  };

  return await findPosts({
    whereClause,
    workspaceID,
    sort,
    limit,
    search,
    ids,
    groupIDs: [id],
    client,
    user,
    memberGroupIDs,
  });
}

export async function findGroupById(
  id: ID,
  workspaceID: ID,
  client: Client,
  user?: User,
  archived = false,
) {
  if (!workspaceID) {
    return null;
  }

  const archivedFilter = getArchivedFilter({archived});

  const group = await client.aOSPortalForumGroup.findOne({
    where: {
      id,
      workspace: {
        id: workspaceID,
      },
      AND: [filterPrivate({user}), archivedFilter],
    },
    select: {
      name: true,
      description: true,
      image: {
        fileName: true,
      },
      thumbnailImage: {
        id: true,
        fileName: true,
      },
    },
  });
  return group;
}

export async function findMemberGroupById({
  id,
  groupID,
  workspaceID,
  client,
  user,
  archived = false,
}: {
  id: ID;
  groupID: ID;
  workspaceID: ID;
  client: Client;
  user?: User;
  archived?: boolean;
}) {
  if (!workspaceID) {
    return null;
  }

  if (!(id || groupID)) {
    return null;
  }
  const group = await client.aOSPortalForumGroupMember.findOne({
    where: {
      id,
      forumGroup: {
        workspace: {
          id: workspaceID,
        },
        id: groupID,
        AND: [filterPrivate({user}), getArchivedFilter({archived})],
      },
    },
    select: {
      forumGroup: {id: true},
    },
  });

  return group;
}

export async function findRecentlyActivePosts({
  workspaceID,
  client,
  user,
  limit = 3,
}: {
  workspaceID: WorkspaceLight['id'];
  client: Client;
  user?: User;
  limit?: number;
}): Promise<RecentlyActivePost[]> {
  if (!workspaceID) return [];

  const params: unknown[] = [];
  let idx = 1;

  params.push(workspaceID);
  let whereClause = `WHERE forumGroup.workspace = $${idx++}`;

  const {
    clause: privateClause,
    params: privateParams,
    nextIndex,
  } = await filterPrivateQuery(user, client, idx);
  whereClause += ` ${privateClause}`;
  params.push(...privateParams);
  idx = nextIndex;

  whereClause +=
    ' AND COALESCE(post.archived, false) IS FALSE AND COALESCE(forumGroup.archived, false) IS FALSE';

  params.push(limit);
  const limitIdx = idx++;

  const posts = await client.$raw(
    `
    WITH LatestComment AS (
        SELECT
            m.id AS "commentId",
            m.related_id AS "postId",
            m.note AS "commentNote",
            m.created_on AS "commentDate",
            m.version AS "commentVersion",
            m.created_by AS "commentCreatedById",
            m.partner AS "commentPartnerId",
            ROW_NUMBER() OVER (PARTITION BY m.related_id ORDER BY m.created_on DESC) as rn
        FROM mail_message m
        WHERE m.related_model = 'com.axelor.apps.portal.db.ForumPost'
          AND m.parent_mail_message IS NULL
          AND m.note IS NOT NULL
          AND m.note <> ''
    )
    SELECT
        post.id,
        post.title,
        post.version,
        JSON_BUILD_OBJECT(
            'id', lc."commentId",
            'version', lc."commentVersion",
            'note', lc."commentNote",
            'createdOn', lc."commentDate",
            'partner', JSON_BUILD_OBJECT(
                'id', bp.id,
                'version', bp.version,
                'name', bp.name,
                'simpleFullName', bp.simple_full_name
            ),
            'createdBy', JSON_BUILD_OBJECT(
                'id', au.id,
                'version', au.version,
                'name', au.name,
                'fullName', au.full_name
            )
        ) AS comment,
        JSON_BUILD_OBJECT(
            'id', forumGroup.id,
            'version', forumGroup.version,
            'name', forumGroup.name
        ) AS "forumGroup"
    FROM portal_forum_post post
    JOIN LatestComment lc ON post.id = lc."postId" AND lc.rn = 1
    LEFT JOIN portal_forum_group forumGroup ON post.forum_group = forumGroup.id
    LEFT JOIN base_partner bp ON lc."commentPartnerId" = bp.id
    LEFT JOIN auth_user au ON lc."commentCreatedById" = au.id
    ${whereClause}
    ORDER BY lc."commentDate" DESC
    LIMIT $${limitIdx}
    `,
    ...params,
  );

  return posts as RecentlyActivePost[];
}
