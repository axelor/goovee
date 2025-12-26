import {createPost} from '../api';
import {getDisplayName} from '../services/services';

export const addPost = async (
  setCurrentChannel: any,
  channelId: string,
  token: string,
  byMe: boolean,
  user: any,
  post?: any,
  files?: File[],
  postReply?: any,
) => {
  if (byMe) {
    let postCreated;
    if (postReply) {
      postCreated = await createPost(
        channelId,
        post,
        postReply.id,
        files,
        token,
      );
      postCreated.root_id = postReply.id;
    } else {
      postCreated = await createPost(channelId, post, null, files, token);
    }
    updateLocalState(setCurrentChannel, postCreated, user);
  } else {
    updateLocalState(setCurrentChannel, post);
  }
};

const updateLocalState = (setCurrentChannel: any, post: any, user?: any) => {
  setCurrentChannel((prevChannel: any) => {
    const updatedGroupsPosts = [...prevChannel.groupsPosts];
    const lastGroup = updatedGroupsPosts[updatedGroupsPosts.length - 1];

    let displayName;
    if (user) {
      displayName = getDisplayName(user);
    } else {
      const user = findUserById(prevChannel.users, post.user_id);
      displayName = getDisplayName(user);
    }

    if (lastGroup && lastGroup[0].user_id === post.user_id) {
      updatedGroupsPosts[updatedGroupsPosts.length - 1] = [...lastGroup, post];
    } else {
      updatedGroupsPosts.push([{...post, displayName}]);
    }

    return {
      ...prevChannel,
      groupsPosts: updatedGroupsPosts,
    };
  });
};

const findUserById = (users: any[], userId: string) => {
  return users.find(user => user.id === userId) || null;
};
