'use server';

import {z} from 'zod';
import fs from 'fs';
import {headers} from 'next/headers';
import path from 'path';
import {pipeline} from 'stream';
import {promisify} from 'util';
import {after} from 'next/server';
import {revalidatePath} from 'next/cache';

// ---- CORE IMPORTS ---- //
import {t, getTranslation} from '@/locale/server';
import {DEFAULT_LOCALE} from '@/locale/contants';
import {clone} from '@/utils';
import {ModelMap, SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {ID} from '@/types';
import {PortalWorkspace} from '@/orm/workspace';
import {getSession} from '@/auth';
import {getFileSizeText} from '@/utils/files';
import {manager} from '@/tenant';
import type {Client} from '@/goovee/.generated/client';
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
import {getStoragePath} from '@/storage/index';
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
import {NOTIFICATION_VALUES} from '@/subapps/forum/common/constants';
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
  type PinGroupInput,
  type ExitGroupInput,
  type JoinGroupInput,
  type AddGroupNotificationInput,
  type GetSubscribersByGroupInput,
  type FindMediaInput,
} from '@/subapps/forum/common/validators';

interface FileMeta {
  fileName: string;
  filePath: string;
  id: string;
}

interface AttachmentResponse {
  title: string;
  metaFile: FileMeta;
}

const pump = promisify(pipeline);

function extractFileValues(formData: FormData) {
  const values: Array<{title?: string; description?: string; file?: File}> = [];

  for (const [key, value] of formData.entries()) {
    const index = Number(key.match(/\[(\d+)\]/)?.[1]);

    if (Number.isNaN(index)) {
      continue;
    }

    if (!values[index]) {
      values[index] = {};
    }

    const field = key.substring(key.lastIndexOf('[') + 1, key.lastIndexOf(']'));

    if (field === 'title' || field === 'description') {
      values[index][field] = value as string;
    } else if (field === 'file') {
      values[index][field] =
        value instanceof File ? value : new File([value], 'filename');
    }
  }
  return values;
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

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return {error: true, message: await t('Unauthorized')};
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client} = tenant;

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.forum,
    user,
    url: workspaceURL,
    client,
  });

  if (!subapp) {
    return {error: true, message: await t('Unauthorized')};
  }

  const workspace = await findWorkspace({user, url: workspaceURL, client});

  if (!workspace) {
    return {error: true, message: await t('Invalid workspace')};
  }

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

  const session = await getSession();

  const user = session?.user;

  if (!user) {
    return {error: true, message: await t('Unauthorized')};
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client} = tenant;

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.forum,
    user,
    url: workspaceURL,
    client,
  });

  if (!subapp) {
    return {error: true, message: await t('Unauthorized')};
  }

  const workspace = await findWorkspace({user, url: workspaceURL, client});

  if (!workspace) {
    return {error: true, message: await t('Invalid workspace')};
  }

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

  const session = await getSession();

  const user = session?.user;

  if (!user) {
    return {error: true, message: await t('Unauthorized')};
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client} = tenant;

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.forum,
    user,
    url: workspaceURL,
    client,
  });

  if (!subapp) {
    return {error: true, message: await t('Unauthorized')};
  }

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return {error: true, message: await t('Invalid workspace')};
  }

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

  const session = await getSession();

  const user = session?.user;

  if (!user) {
    return {error: true, message: await t('Unauthorized')};
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client} = tenant;

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.forum,
    user,
    url: workspaceURL,
    client,
  });

  if (!subapp) {
    return {error: true, message: await t('Unauthorized')};
  }

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return {error: true, message: await t('Invalid workspace')};
  }

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

export async function addPost({
  group,
  title,
  content,
  workspaceURL,
  workspaceURI,
  formData,
}: {
  group: {id: string};
  title: string;
  content: string;
  workspaceURL: string;
  workspaceURI: string;
  formData?: FormData;
}) {
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const session = await getSession();

  const user = session?.user;

  if (!user) {
    return {error: true, message: await t('Unauthorized')};
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client} = tenant;

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.forum,
    user,
    url: workspaceURL,
    client,
  });

  if (!subapp) {
    return {error: true, message: await t('Unauthorized')};
  }

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return {error: true, message: await t('Invalid workspace')};
  }

  let attachmentListArray: {id: string; fileName: string; title: string}[] = [];

  const timeStamp = new Date();
  try {
    const post = await client.$transaction(async txClient => {
      if (formData) {
        const attachmentResponse = await uploadAttachment(formData, txClient);

        if (attachmentResponse.some(item => 'error' in item)) {
          throw new Error(
            await t('Something went wrong while attachment upload!'),
          );
        }

        attachmentListArray = (attachmentResponse as AttachmentResponse[]).map(
          ({title, metaFile}) => ({
            id: metaFile.id,
            fileName: metaFile.fileName,
            title,
          }),
        );
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
            subscribers,
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

  const session = await getSession();
  const user = session?.user;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client} = tenant;

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.forum,
    user,
    url: workspaceURL,
    client,
  });

  if (!subapp) {
    return {error: true, message: await t('Unauthorized')};
  }

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return {error: true, message: await t('Invalid workspace')};
  }

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

export async function fetchPosts({
  sort,
  limit,
  page,
  search = '',
  workspaceURL,
  memberGroupIDs = [],
  groupIDs = [],
}: {
  sort?: string | null;
  limit?: number;
  page?: string | number;
  search?: string | undefined;
  workspaceURL: string;
  memberGroupIDs?: Array<string>;
  groupIDs?: ID[];
}) {
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const session = await getSession();

  const user = session?.user;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client} = tenant;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return {error: true, message: await t('Invalid workspace')};
  }

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

async function uploadAttachment(
  formData: FormData,
  client: Client,
): Promise<(AttachmentResponse | {error: string})[]> {
  const values = extractFileValues(formData);

  const getTimestampFilename = (name: string) =>
    `${new Date().getTime()}-${name}`;

  const create = async ({
    file,
    title,
  }: {
    file: File;
    title: string;
  }): Promise<AttachmentResponse> => {
    const name = file.name;
    const timestampFilename = getTimestampFilename(name);

    try {
      await pump(
        file.stream(),
        fs.createWriteStream(path.resolve(getStoragePath(), timestampFilename)),
      );

      const metaFile = await client.aOSMetaFile.create({
        data: {
          fileName: name,
          filePath: timestampFilename,
          fileType: file.type,
          fileSize: String(file.size),
          sizeText: getFileSizeText(file.size),
        },
        select: {
          id: true,
          fileName: true,
          filePath: true,
        },
      });

      return {
        title,
        metaFile: {
          fileName: metaFile.fileName ?? '',
          filePath: metaFile.filePath ?? '',
          id: metaFile.id,
        },
      };
    } catch (error) {
      throw new Error('Failed to create meta file');
    }
  };

  try {
    const responses = await Promise.all(
      values.map(({title, file}) => create({title: title ?? '', file: file!})),
    );

    return responses;
  } catch (error) {
    console.error('Error processing files:', error);
    return [{error: 'Failed to upload attachments'}];
  }
}

export async function fetchGroupsByMembers({
  id,
  searchKey,
  orderBy,
  workspaceID,
}: {
  id: ID;
  searchKey?: string;
  orderBy?: Record<string, unknown>;
  workspaceID: PortalWorkspace['id'];
}) {
  const tenantId = (await headers()).get(TENANT_HEADER);

  const session = await getSession();

  const user = session?.user;

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client} = tenant;

  return await findGroupsByMembers({
    id,
    searchKey,
    orderBy,
    workspaceID,
    client,
    user,
  });
}

export const createComment: CreateComment = async props => {
  const session = await getSession();
  const user = session?.user;
  if (!user) {
    return {error: true, message: await t('Unauthorized')};
  }

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }

  const parsed = CreateCommentPropsSchema.safeParse(props);
  if (!parsed.success) {
    return {error: true, message: await t('Invalid request')};
  }
  const {workspaceURL, workspaceURI, ...rest} = parsed.data;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client} = tenant;

  const workspace = await findWorkspace({user, url: workspaceURL, client});
  if (!workspace) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const {workspaceUser} = workspace;
  if (!workspaceUser) {
    return {error: true, message: await t('Workspace user is missing')};
  }

  if (!isCommentEnabled({subapp: SUBAPP_CODES.forum, workspace})) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.forum];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const app = await findSubappAccess({
    code: SUBAPP_CODES.forum,
    user,
    url: workspaceURL,
    client,
  });

  if (!app?.isInstalled) {
    return {error: true, message: await t('Unauthorized Access')};
  }

  const {posts} = await findPosts({
    whereClause: {id: rest.recordId},
    workspaceID: workspace.id,
    client,
    user,
  });

  if (!posts?.length) {
    return {error: true, message: await t('Record not found')};
  }

  const memberGroups = (await findGroupsByMembers({
    id: user.id,
    workspaceID: workspace.id!,
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
    const [comment, parentComment] = await client.$transaction(txClient =>
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

  const session = await getSession();
  const user = session?.user;
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client} = tenant;

  const workspace = await findWorkspace({user, url: workspaceURL, client});
  if (!workspace) {
    return {error: true, message: await t('Invalid workspace')};
  }

  if (!isCommentEnabled({subapp: SUBAPP_CODES.forum, workspace})) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.forum];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const app = await findSubappAccess({
    code: SUBAPP_CODES.forum,
    user,
    url: workspaceURL,
    client,
  });
  if (!app?.isInstalled) {
    return {error: true, message: await t('Unauthorized Access')};
  }

  const {posts} = await findPosts({
    whereClause: {id: rest.recordId},
    workspaceID: workspace.id,
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

  const session = await getSession();

  const user = session?.user;

  if (!user) {
    return {error: true, message: await t('Unauthorized')};
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client} = tenant;

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.forum,
    user,
    url: workspaceURL,
    client,
  });

  if (!subapp) {
    return {error: true, message: await t('Unauthorized')};
  }

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return {error: true, message: await t('Invalid workspace')};
  }

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
