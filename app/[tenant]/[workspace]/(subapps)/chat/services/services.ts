import {
  getChannelById,
  getChannelsTeam,
  getChannelUsers,
  getFileInfoById,
  getFileLink,
  getPostsChannel,
  getUnreadChannel,
} from '../api';

const characters =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export const getDisplayName = (user: any | undefined): string => {
  if (!user) {
    return '';
  }
  if (!user.first_name || !user.last_name) {
    if (!user.nickname) {
      return user.username || '';
    }
    return getDisplayNickName(user.nickname);
  }
  return `${user.first_name} ${user.last_name}`;
};

export const getDisplayNickName = (name: string) => {
  const words = name.toLowerCase().split(' ');
  const capitalizedWords = words.map(
    word => word.charAt(0).toUpperCase() + word.slice(1),
  );
  return capitalizedWords.join(' ');
};

export async function asyncForEach(array: any, callback: any) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export const getFiles = async (fileIds: File[], token: string) => {
  const files: File[] = [];
  await asyncForEach(fileIds, async (fileId: string) => {
    const fileInfo = await getFileInfoById(fileId, token);
    const {link} = await getFileLink(fileId, token);
    if ('status_code' in fileInfo) {
      return;
    }
    if (fileInfo) {
      files.push({...fileInfo, publicLink: link});
    }
  });

  return files;
};

export const getFormattedPosts = async (
  channelId: string,
  users: any[],
  token: string,
  options: any = {},
) => {
  const data = await getPostsChannel(token, channelId, options);
  if ('status_code' in data) {
    return [];
  }
  const {posts} = data;
  const postList: any[] = [];
  await asyncForEach(Object.keys(posts), async (key: string) => {
    const post = posts[key];
    const root = {author: '', text: '', postId: ''};
    const postUser = users.find((u: any) => u.id === post.user_id);
    const displayName = getDisplayName(postUser);
    postList.push({
      ...post,
      displayName,
      root: root,
    });
  });
  return postList;
};

export const getChannelInfosByChannelId = async (
  channelId: string,
  token: string,
  options: any = {},
) => {
  const channel = await getChannelById(channelId, token);
  if ('status_code' in channel) {
    return {posts: [], name: '', users: [], channel: {id: undefined}};
  }
  const channelUsers: any[] = await getChannelUsers(channelId, token);
  if ('status_code' in channelUsers) {
    return {posts: [], name: '', users: [], channel};
  }
  const posts: any[] = await getFormattedPosts(
    channelId,
    channelUsers,
    token,
    options,
  );

  posts.sort((a: any, b: any) => {
    return a.create_at - b.create_at;
  });

  const groups = posts.reduce((groups, post) => {
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup[0].displayName === post.displayName) {
      lastGroup.push(post);
    } else {
      groups.push([post]);
    }

    return groups;
  }, []);

  return {
    groupsPosts: groups,
    name: channel.displayName,
    users: channelUsers,
    channel,
  };
};

export const generateUniqueId = () => {
  let result = ' ';
  const charactersLength = characters.length;
  for (let i = 0; i < 36; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

export const getChannelsWithUnreadCount = async (
  token: any,
  teamId: any,
  userId: any,
) => {
  try {
    const channels = await getChannelsTeam(token, teamId, userId);

    const channelsWithUnread = await Promise.all(
      channels.map(async (channel: any) => {
        try {
          const {data} = await getUnreadChannel(channel.id, userId, token);

          return {
            ...channel,
            unread: data.msg_count,
          };
        } catch (error) {
          console.error(
            `Erreur lors de la récupération des messages non lus pour le canal ${channel.id}:`,
            error,
          );
          return {
            ...channel,
            unread: 0,
          };
        }
      }),
    );

    return channelsWithUnread;
  } catch (error) {
    console.error(
      'Erreur lors de la récupération des canaux avec les messages non lus:',
      error,
    );
    throw error;
  }
};
