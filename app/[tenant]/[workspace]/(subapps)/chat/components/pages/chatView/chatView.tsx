'use client';

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ChannelList} from '../../atoms';
import {ChannelView} from '../../organisms';
import {getPostById, viewChannel} from '../../../api';
import {Socket} from '../../Socket';
import {
  getChannelInfosByChannelId,
  getChannelsWithUnreadCount,
} from '../../../services/services';
import {addReaction} from '../../../utils/AddReaction';
import {addPost} from '../../../utils/addPost';
import {
  ChannelType,
  Post,
  Reaction,
  User,
  UserStatus,
} from '../../../types/types';
import {deletePost} from '../../../utils/deletePost';
import {DEFAULT_CHANNEL, DEFAULT_TOPIC} from '../../../constants';

export const ChatView = ({
  token,
  user,
  userStatus,
  users,
  teamId,
}: {
  token: string | null | undefined;
  user: User;
  userStatus: UserStatus;
  users: User[];
  teamId: string | undefined;
}) => {
  const [activeChannel, setActiveChannel] = useState<string>('');
  const [_channels, setChannels] = useState<ChannelType | ChannelType[]>([]);
  const [_currentChannel, setCurrentChannel] = useState<any>();
  const [channelJustSelected, setChannelJustSelected] = useState(false);
  const [newMessage, setNewMessage] = useState<boolean>(false);
  const activeChannelRef = useRef(activeChannel);

  const updateChannelUnread = (channelId: string, newMessage: boolean) => {
    setChannels((prevChannels: ChannelType | ChannelType[]) => {
      if (!Array.isArray(prevChannels)) {
        return prevChannels;
      }
      return prevChannels.map((channel: ChannelType) =>
        channel.id === channelId
          ? {...channel, unread: newMessage ? channel.unread + 1 : 0}
          : channel,
      );
    });
  };

  useEffect(() => {
    const fetchChannels = async () => {
      const channels = await getChannelsWithUnreadCount(token, teamId, user.id);
      const filteredChannels = channels.filter((channel: ChannelType) => {
        return (
          channel.display_name != null &&
          channel.display_name.trim() !== '' &&
          channel.display_name != DEFAULT_CHANNEL &&
          channel.display_name != DEFAULT_TOPIC
        );
      });
      setChannels(filteredChannels);
      if (userStatus && userStatus.active_channel) {
        setActiveChannel(userStatus.active_channel);
      } else {
        setActiveChannel(filteredChannels[0].id);
      }
    };
    fetchChannels();
  }, [teamId, token, user.id, userStatus]);

  useEffect(() => {
    activeChannelRef.current = activeChannel;
    setChannelJustSelected(true);
    const fetchCurrentChannel = async () => {
      if (activeChannel) {
        const currentChannel = await getChannelInfosByChannelId(
          activeChannel,
          token,
        );
        console.log('voici le current channel', currentChannel);
        setCurrentChannel(currentChannel);
        await viewChannel(user.id, activeChannel, token);
        updateChannelUnread(activeChannel, false);
      }
    };
    fetchCurrentChannel();
  }, [activeChannel, token, user.id]);

  const handleNewPost = useCallback(
    async (channelId: string, rootId: string, post: Post) => {
      console.log('on recoisn un nouveau ost');
      if (channelId == activeChannelRef.current && user.id !== post.user_id) {
        addPost(setCurrentChannel, channelId, token, false, user, post);
        setNewMessage(true);
      } else if (channelId !== activeChannelRef.current) {
        updateChannelUnread(channelId, true);
      }
    },
    [setCurrentChannel, token, user],
  );

  const sendMessage = (
    postText: string,
    channelId: string,
    files?: File[],
    postReply?: Post,
  ) => {
    addPost(
      setCurrentChannel,
      channelId,
      token,
      true,
      user,
      postText,
      files,
      postReply,
    );
  };

  const handleDeletedPost = useCallback(
    async (channelId: string, rootId: string, post: Post) => {
      if (channelId == activeChannelRef.current) {
        console.log('ce post a été effecé : ', post);
        deletePost(setCurrentChannel, post);
      }
    },
    [],
  );

  const handleNewReaction = useCallback(
    async (channelId: string, postId: string, reaction: Reaction) => {
      if (
        channelId === activeChannelRef.current &&
        user.id !== reaction.user_id
      ) {
        addReaction(
          setCurrentChannel,
          reaction.emoji_name,
          postId,
          reaction.user_id,
          token,
          false,
        );
      }
    },
    [setCurrentChannel, token, user.id],
  );

  const handleEmojiClick = useCallback(
    (name: string, postId: string) => {
      addReaction(setCurrentChannel, name, postId, user.id, token, true);
    },
    [user, setCurrentChannel, token],
  );

  const loadMoreMessages = async () => {
    if (
      !_currentChannel ||
      !_currentChannel.groupsPosts ||
      _currentChannel.groupsPosts.length === 0
    ) {
      console.log('Pas de messages à charger');
      return;
    }

    const oldestPostId = _currentChannel.groupsPosts[0][0].id;

    try {
      const oldCurrentChannel = await getChannelInfosByChannelId(
        activeChannel,
        token,
        {
          before: oldestPostId,
          per_page: 60,
        },
      );

      const olderMessages = oldCurrentChannel.groupsPosts;

      if (olderMessages && olderMessages.length > 0) {
        setCurrentChannel((prevChannel: any) => {
          const updatedGroupsPosts = [
            ...olderMessages,
            ...prevChannel.groupsPosts,
          ];

          return {
            ...prevChannel,
            groupsPosts: updatedGroupsPosts,
          };
        });
      } else {
        console.log('Pas de messages plus anciens à charger');
      }
    } catch (error) {
      console.error(
        'Erreur lors du chargement des messages plus anciens:',
        error,
      );
    }
  };

  const getPost = async (root_id: string) => {
    const previousPost = await getPostById(root_id, token);
    return previousPost;
  };

  return (
    <div className="flex h-full">
      {_channels.length > 1 && (
        <ChannelList
          channels={_channels}
          activeChannel={activeChannel}
          setActiveChannel={setActiveChannel}
        />
      )}
      {_currentChannel && (
        <ChannelView
          channel={_currentChannel}
          token={token}
          onEmojiClick={handleEmojiClick}
          channelId={activeChannel}
          channelJustSelected={channelJustSelected}
          setChannelJustSelected={setChannelJustSelected}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sendMessage={sendMessage}
          loadMoreMessages={loadMoreMessages}
          getPost={getPost}
          users={users}
        />
      )}
      <Socket
        token={token}
        connectedUserId={user.id}
        handleNewPost={handleNewPost}
        handleReaction={handleNewReaction}
        handleDeletedPost={handleDeletedPost}
      />
    </div>
  );
};
