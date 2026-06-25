'use server';

import {z} from 'zod';
import {headers} from 'next/headers';
import {after} from 'next/server';
import {revalidatePath} from 'next/cache';

// ---- CORE IMPORTS ---- //
import {t, getTranslation} from '@/locale/server';
import {DEFAULT_LOCALE} from '@/locale/contants';
import {clone} from '@/utils';
import {ModelMap, SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {getForumConfig} from '@/subapps/forum/common/orm/config';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {accessMessage} from '@/lib/core/access/denial';
import {ID} from '@/types';
import type {Client} from '@/goovee/.generated/client';
import {redeemUpload} from '@/lib/core/upload/staged-upload';
import {TENANT_HEADER} from '@/proxy';
import {filterPrivate} from '@/orm/filter';
import {
  CreateComment,
  CreateCommentPropsSchema,
  FetchComments,
  FetchCommentsPropsSchema,
  isCommentEnabled,
} from '@/comments';
import {addComment, findComments} from '@/comments/orm';
import {notifyUser} from '@/pwa/utils';
import {NotificationTag} from '@/pwa/tags';
import {withBasePath} from '@/lib/core/path/base-path';

//----LOCAL IMPORTS -----//
import {
  findGroupById,
  findGroupsByMembers,
  findMemberGroupById,
  findPosts,
} from '@/subapps/forum/common/orm/forum';
import {
  FORUM_POST_ATTACHMENT_PURPOSE,
  NOTIFICATION_VALUES,
} from '@/subapps/forum/common/constants';
import {sendEmailNotifications} from '@/subapps/forum/common/utils/mail';
import {ContentType, MemberGroup} from '@/subapps/forum/common/types/forum';
import {getArchivedFilter} from '@/subapps/forum/common/utils';
import {
  PinGroupSchema,
  ExitGroupSchema,
  JoinGroupSchema,
  AddGroupNotificationSchema,
  GetSubscribersByGroupSchema,
  FindMediaSchema,
  AddPostSchema,
  FetchPostsSchema,
  FetchGroupsByMembersSchema,
  type PinGroupInput,
  type ExitGroupInput,
  type JoinGroupInput,
  type AddGroupNotificationInput,
  type GetSubscribersByGroupInput,
  type FindMediaInput,
  type AddPostInput,
  type FetchPostsInput,
  type FetchGroupsByMembersInput,
  type PostAttachmentInput,
} from '@/subapps/forum/common/validators';

/**
 * Redeem pre-staged upload claims into `meta_file` ids. Each token is verified
 * (owner + purpose + freshness) and consumed in the caller's transaction; the
 * per-file `title` is carried onto the post-attachment join record.
 */
async function redeemAttachments({
  attachments,
  owner,
  client,
}: {
  attachments: PostAttachmentInput[];
  owner: ID;
  client: Client;
}): Promise<{id: ID; title: string}[]> {
  const redeemed: {id: ID; title: string}[] = [];

  for (const {token, title} of attachments) {
    const id = await redeemUpload({
      token,
      purpose: FORUM_POST_ATTACHMENT_PURPOSE,
      owner,
      client,
    });
    redeemed.push({id, title});
  }

  return redeemed;
}

export async function pinGroup({
  isPin,
  id,
  groupID,
  workspaceURL,
  workspaceURI,
}: PinGroupInput) {
  const parsed = PinGroupSchema.safeParse({
    isPin,
    id,
    groupID,
    workspaceURL,
    workspaceURI,
  });
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.forum,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {user, workspace} = access;
  const {client} = access.tenant;

  const memberGroup = await findMemberGroupById({
    id,
    groupID,
    workspaceID: workspace.id,
    client,
    user,
  });

  if (!memberGroup) {
    return {
      error: true,
      message: await t('Member group not found.'),
    };
  }

  try {
    const result = await client.aOSPortalForumGroupMember
      .update({
        data: {
          id: memberGroup.id,
          version: memberGroup.version,
          forumGroup: {
            select: {
              id: memberGroup?.forumGroup?.id,
            },
          },
          isPin,
        },
        select: {id: true},
      })
      .then(clone);

    revalidatePath(`${workspaceURI}/${SUBAPP_CODES.forum}`);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('error >>>', error);
    return {
      error: true,
      message: await t('Some error occurred'),
    };
  }
}

export async function exitGroup({
  id,
  groupID,
  workspaceURL,
  workspaceURI,
}: ExitGroupInput) {
  const parsed = ExitGroupSchema.safeParse({
    id,
    groupID,
    workspaceURL,
    workspaceURI,
  });
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.forum,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {user, workspace} = access;
  const {client} = access.tenant;

  const memberGroup = await findMemberGroupById({
    id,
    groupID,
    workspaceID: workspace.id,
    client,
    user,
  });

  if (!memberGroup) {
    return {
      error: true,
      message: await t('Member not part of the group'),
    };
  }

  try {
    const result = await client.aOSPortalForumGroupMember
      .delete({
        id: memberGroup.id,
        version: memberGroup.version,
      })
      .then(clone);
    revalidatePath(`${workspaceURI}/${SUBAPP_CODES.forum}`);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('error >>>', error);
    return {
      error: true,
      message: await t('Some error occurred'),
    };
  }
}

export async function joinGroup({
  groupID,
  userId,
  workspaceURL,
  workspaceURI,
}: JoinGroupInput) {
  const parsed = JoinGroupSchema.safeParse({
    groupID,
    userId,
    workspaceURL,
    workspaceURI,
  });
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.forum,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {user, workspace} = access;
  const {client} = access.tenant;

  const group = await findGroupById(groupID, workspace.id, client, user);

  if (!group) {
    return {
      error: true,
      message: await t('Member not part of the group'),
    };
  }

  try {
    const result = await client.aOSPortalForumGroupMember
      .create({
        data: {
          forumGroup: {
            select: {
              id: group.id,
            },
          },
          member: {
            select: {id: userId},
          },
          notificationSelect: NOTIFICATION_VALUES.ALL_ON_MY_POST,
          isPin: false,
        },
        select: {id: true},
      })
      .then(clone);

    revalidatePath(`${workspaceURI}/${SUBAPP_CODES.forum}`);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('error >>>', error);
    return {
      error: true,
      message: await t('Some error occurred'),
    };
  }
}

export async function addGroupNotification({
  id,
  groupID,
  notificationType,
  workspaceURL,
  workspaceURI,
}: AddGroupNotificationInput) {
  const parsed = AddGroupNotificationSchema.safeParse({
    id,
    groupID,
    notificationType,
    workspaceURL,
    workspaceURI,
  });
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.forum,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {user, workspace} = access;
  const {client} = access.tenant;

  const memberGroup = await findMemberGroupById({
    id,
    groupID,
    workspaceID: workspace.id,
    client,
    user,
  });

  if (!memberGroup) {
    return {
      error: true,
      message: await t('Member not part of the group'),
    };
  }

  try {
    const response = await client.aOSPortalForumGroupMember
      .update({
        data: {
          id: memberGroup.id,
          version: memberGroup.version,
          notificationSelect: notificationType,
        },
        select: {id: true},
      })
      .then(clone);

    revalidatePath(`${workspaceURI}/${SUBAPP_CODES.forum}`);
    return {success: true, data: response};
  } catch (error) {
    console.error('error >>>', error);
    return {
      error: true,
      message: await t('Some error occurred'),
    };
  }
}

export async function addPost(input: AddPostInput) {
  const parsed = AddPostSchema.safeParse(input);
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }
  const {group, title, content, workspaceURL, workspaceURI} = parsed.data;
  const attachments = parsed.data.attachments ?? [];

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.forum,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {user, workspace} = access;
  const {client} = access.tenant;

  const targetGroup = await findGroupById(group.id, workspace.id, client, user);

  if (!targetGroup) {
    return {error: true, message: await t('Invalid group')};
  }

  let attachmentListArray: {id: ID; title: string}[] = [];

  const timeStamp = new Date();
  try {
    const post = await access.tenant.client.$transaction(async txClient => {
      if (attachments.length) {
        attachmentListArray = await redeemAttachments({
          attachments,
          owner: user.id,
          client: txClient,
        });
      }

      return txClient.aOSPortalForumPost.create({
        select: {
          attachmentList: {
            select: {
              metaFile: {
                fileName: true,
                fileType: true,
                fileSize: true,
                filePath: true,
                sizeText: true,
                createdOn: true,
                updatedOn: true,
              },
            },
          },
          title: true,
          forumGroup: {
            name: true,
          },
          postDateT: true,
          content: true,
          author: {
            id: true,
            simpleFullName: true,
            fullName: true,
          },
          createdOn: true,
        },
        data: {
          postDateT: timeStamp,
          createdOn: timeStamp,
          forumGroup: {select: {id: group.id}},
          title,
          content,
          author: {select: {id: user.id}},
          attachmentList:
            attachmentListArray.length > 0
              ? {
                  create: attachmentListArray.map(item => ({
                    title: item.title,
                    metaFile: {select: {id: item.id}},
                  })),
                }
              : null,
        },
      });
    }); // end $transaction

    const subscribers = await getSubscribersByGroup({
      groupID: group.id,
      workspaceURL,
    });

    if (!('error' in subscribers)) {
      const postLink = `${workspaceURL}/${SUBAPP_CODES.forum}/${SUBAPP_PAGE.group}/${group.id}?searchid=${post.id}#post-${post.id}`;

      const notificationRecievers = subscribers.filter(
        sub => sub.member?.id !== user.id, // exclude the post author
      );

      for (const reciever of subscribers) {
        const member = reciever.member;
        if (
          member?.id &&
          member.id !== user.id // exclude the post author
        ) {
          const tr = getTranslation.bind(null, {
            locale: member.localization?.code || DEFAULT_LOCALE,
            tenant: tenantId,
          });
          after(async () => {
            await notifyUser({
              userId: member.id,
              tenantId,
              workspaceURL,
              client,
              payload: {
                title: await tr(
                  '{0} created a new post',
                  user.simpleFullName || user.name || '',
                ),
                body: post?.title ?? '',
                url: postLink,
                tag: NotificationTag.forumNewPost(post.id),
              },
            });
          });
        }
      }

      if (post?.author && post?.forumGroup) {
        after(() =>
          sendEmailNotifications({
            type: ContentType.POST,
            title: post?.title ?? '',
            content: post?.content ?? '',
            author: {
              id: post.author!.id,
              simpleFullName: post.author!.simpleFullName ?? '',
            },
            group: {name: post.forumGroup!.name ?? ''},
            subscribers: notificationRecievers,
            link: postLink,
          }),
        );
      }
    }
    revalidatePath(`${workspaceURI}/${SUBAPP_CODES.forum}`);
    return {success: true, data: clone(post)};
  } catch (error) {
    return {
      error: true,
      message: await t('Failed to create post'),
    };
  }
}

export async function findMedia({
  id,
  workspaceURL,
  archived = false,
}: FindMediaInput) {
  const parsed = FindMediaSchema.safeParse({id, workspaceURL, archived});
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.forum,
    url: workspaceURL,
    tenantId,
    allowGuest: true,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {user} = access;
  const {client} = access.tenant;

  return await client.aOSPortalForumPost
    .find({
      where: {
        ...(id
          ? {
              forumGroup: {
                id,
                AND: [
                  await filterPrivate({user, client}),
                  getArchivedFilter({archived}),
                ],
              },
            }
          : {}),
      },
      select: {
        attachmentList: {
          select: {
            title: true,
            metaFile: {
              fileName: true,
              fileType: true,
            },
          },
        },
      },
    })
    .then(clone);
}

export async function fetchPosts(input: FetchPostsInput) {
  const parsed = FetchPostsSchema.safeParse(input);
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }
  const {
    sort,
    limit,
    page,
    search = '',
    workspaceURL,
    memberGroupIDs = [],
    groupIDs = [],
  } = parsed.data;

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.forum,
    url: workspaceURL,
    tenantId,
    allowGuest: true,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {user, workspace} = access;
  const {client} = access.tenant;

  return await findPosts({
    sort,
    limit,
    page,
    search,
    workspaceID: workspace.id,
    client,
    user,
    groupIDs,
    memberGroupIDs,
  }).then(clone);
}

export async function fetchGroupsByMembers(input: FetchGroupsByMembersInput) {
  const parsed = FetchGroupsByMembersSchema.safeParse(input);
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }
  const {id, searchKey, orderBy, workspaceID, workspaceURL} = parsed.data;

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.forum,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  return await findGroupsByMembers({
    id,
    searchKey,
    orderBy,
    workspaceID,
    client: access.tenant.client,
    user: access.user,
  });
}

export const createComment: CreateComment = async props => {
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }

  const parsed = CreateCommentPropsSchema.safeParse(props);
  if (!parsed.success) {
    return {error: true, message: await t('Invalid request')};
  }
  const {workspaceURL, workspaceURI, ...rest} = parsed.data;

  const access = await ensureAuth({
    code: SUBAPP_CODES.forum,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {user} = access;
  const {client} = access.tenant;

  const config = await getForumConfig(access.workspace.config.id, client);
  if (!config) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const {workspaceUser} = access.workspace;
  if (!workspaceUser) {
    return {error: true, message: await t('Workspace user is missing')};
  }

  if (!isCommentEnabled({subapp: SUBAPP_CODES.forum, config})) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.forum];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const {posts} = await findPosts({
    whereClause: {id: rest.recordId},
    workspaceID: access.workspace.id,
    client,
    user,
  });

  if (!posts?.length) {
    return {error: true, message: await t('Record not found')};
  }

  const memberGroups = (await findGroupsByMembers({
    id: user.id,
    workspaceID: access.workspace.id!,
    client,
    user,
  })) as MemberGroup[];

  const memberGroupIDs = memberGroups?.map(group => group.forumGroup?.id) || [];

  const isAllowedToComment = memberGroupIDs?.includes(posts[0].forumGroup?.id);
  if (!isAllowedToComment) {
    return {
      error: true,
      message: await t('You do not have permission to comment'),
    };
  }

  try {
    // keeps attachment tokens redeemable if creation fails
    const [comment, parentComment] = await access.tenant.client.$transaction(
      txClient =>
        addComment({
          modelName,
          userId: user.id,
          workspaceUserId: workspaceUser.id,
          client: txClient,
          commentField: 'note',
          trackingField: 'publicBody',
          subject: `${user.simpleFullName || user.name} added a comment`,
          ...rest,
        }),
    );

    if (comment) {
      const post = posts[0];

      if (post?.id) {
        const subscribers = await getSubscribersByGroup({
          groupID: post.forumGroup.id,
          workspaceURL,
        });

        if (!('error' in subscribers)) {
          const postLink = `${workspaceURL}/${SUBAPP_CODES.forum}/${SUBAPP_PAGE.group}/${post.forumGroup.id}?searchid=${post.id}#post-${post.id}`;

          const notificationRecievers = subscribers.filter(
            sub => sub.member?.id !== user.id, // exclude the commenter
          );

          const isReply = Boolean(parentComment);

          if (isReply) {
            if (
              parentComment?.partner?.id &&
              parentComment.partner.id !== user.id
            ) {
              const tr = getTranslation.bind(null, {
                locale:
                  parentComment.partner.localization?.code || DEFAULT_LOCALE,
                tenant: tenantId,
              });
              after(async () => {
                await notifyUser({
                  userId: parentComment.partner!.id,
                  tenantId,
                  workspaceURL,
                  client,
                  payload: {
                    title: await tr(
                      '{0} replied to your comment',
                      user.simpleFullName || user.name || '',
                    ),
                    body: comment.note ?? '',
                    url: withBasePath(
                      `${workspaceURI}/${SUBAPP_CODES.forum}/${SUBAPP_PAGE.group}/${post.forumGroup.id}?searchid=${post.id}#post-${post.id}`,
                    ),
                    tag: NotificationTag.forumReply(parentComment.id),
                  },
                  getReplacementTitle: count =>
                    tr(
                      'You have {0} new replies to your comment',
                      String(count),
                    ),
                });
              });

              const replySubscriber = notificationRecievers.find(
                sub => sub.member?.id === parentComment.partner!.id,
              );

              if (replySubscriber) {
                after(() =>
                  sendEmailNotifications({
                    type: ContentType.COMMENT,
                    title: post.title ?? '',
                    content: comment.note ?? '',
                    author: {
                      id: comment?.partner?.id ?? '',
                      simpleFullName:
                        comment?.partner?.simpleFullName ?? 'Unknown User',
                    },
                    postAuthor: {
                      id: post?.author?.id ?? '',
                    },
                    group: post.forumGroup,
                    subscribers: [replySubscriber],
                    link: postLink,
                  }),
                );
              }
            }
          } else {
            for (const reciever of notificationRecievers) {
              if (reciever.member?.id) {
                const tr = getTranslation.bind(null, {
                  locale: reciever.member.localization?.code || DEFAULT_LOCALE,
                  tenant: tenantId,
                });
                after(async () => {
                  await notifyUser({
                    userId: reciever.member!.id,
                    tenantId,
                    workspaceURL,
                    client,
                    payload: {
                      title: await tr(
                        '{0} added a comment',
                        user.simpleFullName || user.name || '',
                      ),
                      body: comment.note ?? '',
                      url: withBasePath(
                        `${workspaceURI}/${SUBAPP_CODES.forum}/${SUBAPP_PAGE.group}/${post.forumGroup.id}?searchid=${post.id}#post-${post.id}`,
                      ),
                      tag: NotificationTag.forumPostComment(post.id),
                    },
                    getReplacementTitle: count =>
                      tr(
                        'You have {0} new comments on "{1}"',
                        String(count),
                        post.title ?? '',
                      ),
                  });
                });
              }
            }

            after(() =>
              sendEmailNotifications({
                type: ContentType.COMMENT,
                title: post.title ?? '',
                content: comment.note ?? '',
                author: {
                  id: comment?.partner?.id ?? '',
                  simpleFullName:
                    comment?.partner?.simpleFullName ?? 'Unknown User',
                },
                postAuthor: {
                  id: post?.author?.id ?? '',
                },
                group: post.forumGroup,
                subscribers: notificationRecievers,
                link: postLink,
              }),
            );
          }
        }
      }
    }

    return {success: true, data: clone([comment, parentComment])};
  } catch (e) {
    return {
      error: true,
      message:
        e instanceof Error
          ? e.message
          : await t('An unexpected error occurred while fetching comments.'),
    };
  }
};

export const fetchComments: FetchComments = async props => {
  const {workspaceURL, ...rest} = FetchCommentsPropsSchema.parse(props);

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.forum,
    url: workspaceURL,
    tenantId,
    allowGuest: true,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {user} = access;
  const {client} = access.tenant;

  const config = await getForumConfig(access.workspace.config.id, client);
  if (!config) {
    return {error: true, message: await t('Invalid workspace')};
  }

  if (!isCommentEnabled({subapp: SUBAPP_CODES.forum, config})) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.forum];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const {posts} = await findPosts({
    whereClause: {id: rest.recordId},
    workspaceID: access.workspace.id,
    client,
    user,
  });
  if (!posts.length) {
    return {error: true, message: await t('Record not found')};
  }

  try {
    const data = await findComments({
      modelName,
      client,
      commentField: 'note',
      trackingField: 'publicBody',
      ...rest,
    });
    return {success: true, data: clone(data)};
  } catch (e) {
    return {
      error: true,
      message:
        e instanceof Error
          ? e.message
          : await t('An unexpected error occurred while fetching comments.'),
    };
  }
};

export const getSubscribersByGroup = async ({
  groupID,
  workspaceURL,
}: GetSubscribersByGroupInput) => {
  const parsed = GetSubscribersByGroupSchema.safeParse({groupID, workspaceURL});
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.forum,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {user, workspace} = access;
  const {client} = access.tenant;

  try {
    const result = await client.aOSPortalForumGroupMember.find({
      where: {
        forumGroup: {
          id: groupID,
          ...(await filterPrivate({user, client})),
          workspace: {id: workspace.id},
        },
      },
      select: {
        notificationSelect: true,
        member: {
          id: true,
          emailAddress: {
            address: true,
          },
          simpleFullName: true,
          localization: {code: true},
        },
      },
    });
    return clone(result);
  } catch (error) {
    console.error('Error while fetching group subscribers:', error);
    return {
      error: true,
      message: await t('Failed to fetch group subscribers'),
    };
  }
};
