'use client';

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ChannelList} from './channelList';
import {ChannelView} from './channelView';
import {
  getChannelsTeam,
  createReaction,
  removeReactionFromAPost,
} from '../api/api';
import {Socket} from './Socket';
import {getChannelInfosByChannelId} from '../services/services';
import {addReaction} from '../utils/AddReaction';

const ChatView = ({
  token,
  userId,
  username,
}: {
  token: any;
  userId: any;
  username: string;
}) => {
  const [activeChannel, setActiveChannel] = useState<any>();
  const [_channels, setChannels] = useState<any>(null);
  const [_currentChannel, setCurrentChannel] = useState<any>();
  const activeChannelRef = useRef(activeChannel);
  const teamId: any = '7efg3j4y3pgfpyjkjtmhnoxrcc';

  useEffect(() => {
    const fetchChannels = async () => {
      const channels = await getChannelsTeam(token, teamId, userId);
      const filteredChannels = channels.filter((channel: any) => {
        return (
          channel.display_name != null && channel.display_name.trim() !== ''
        );
      });
      setChannels(filteredChannels);
      setActiveChannel(filteredChannels[0].id);
    };
    fetchChannels();
  }, []);

  useEffect(() => {
    console.log('active channel ', activeChannel);
    activeChannelRef.current = activeChannel;
    const fetchCurrentChannel = async () => {
      const currentChannel = await getChannelInfosByChannelId(
        activeChannel,
        token,
      );
      setCurrentChannel(currentChannel);
    };
    if (activeChannel) {
      fetchCurrentChannel();
    }
  }, [activeChannel]);

  const handleNewPost = useCallback(
    async (channelId: string, rootId: string, post: any) => {
      if (channelId == activeChannelRef.current) {
        setCurrentChannel((prevChannel: any) => {
          const updatedGroupsPosts = [...prevChannel.groupsPosts];
          const lastGroup = updatedGroupsPosts[updatedGroupsPosts.length - 1];

          if (lastGroup && lastGroup[0].displayName === post.displayName) {
            updatedGroupsPosts[updatedGroupsPosts.length - 1] = [
              ...lastGroup,
              post,
            ];
          } else {
            updatedGroupsPosts.push([post]);
          }

          return {
            ...prevChannel,
            groupsPosts: updatedGroupsPosts,
          };
        });
      }
    },
    [activeChannel, setCurrentChannel],
  );

  const handleNewReaction = useCallback(
    async (
      channelId: string,
      postId: string,
      reaction: any,
      senderName: string,
    ) => {
      console.log('on rentre bien dans le handlereaction');
      console.log('voici le userName', username);
      console.log('voici le senderName', senderName);
      if (channelId === activeChannelRef.current && username !== senderName) {
        console.log('voici la réaction : ', reaction);
        addReaction(
          setCurrentChannel,
          reaction.emoji_name,
          postId,
          userId,
          token,
        );
      }
    },
    [activeChannel, setCurrentChannel],
  );

  const handleEmojiClick = useCallback(
    (name: string, postId: string) => {
      addReaction(setCurrentChannel, name, postId, userId, token);
    },
    [userId, setCurrentChannel],
  );

  return (
    <div className="flex h-screen">
      <ChannelList
        channels={_channels}
        activeChannel={activeChannel}
        setActiveChannel={setActiveChannel}
        token={token}
      />
      <ChannelView
        channel={_currentChannel}
        token={token}
        onEmojiClick={handleEmojiClick}
        channelId={activeChannel}
      />
      <Socket
        token={token}
        connectedUserId={userId}
        handleNewPost={handleNewPost}
        handleReaction={handleNewReaction}
      />
    </div>
  );
};

export default ChatView;
