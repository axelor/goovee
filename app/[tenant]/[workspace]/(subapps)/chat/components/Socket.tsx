/* eslint-disable */

import React, {memo, useCallback, useEffect, useState} from 'react';
import {SocketEvents} from '../constants';
import {WebSocketClient} from '../api/websocket';
import {Post, Reaction, SocketMsg} from '../types/types';
import {getWebsocketURL} from '../utils';

let socket: WebSocketClient;

const isSocketEqual = (prevProps: Readonly<any>, nextProps: Readonly<any>) => {
  return (
    prevProps.channelId === nextProps.channelId &&
    prevProps.message === nextProps.message
  );
};

export const Socket = memo(function Socket({
  handleUserTyping,
  handleReaction,
  handleNewPost,
  handleDeletedPost,
  channelId,
  message,
  token,
  connectedUserId,
}: {
  handleUserTyping?: (channelId: string, userId: string) => void;
  handleReaction?: (
    channelId: string,
    postId: string,
    reaction: Reaction,
    add: boolean,
  ) => void;
  handleNewPost?: (channelId: string, rootId: string, post: Post) => void;
  handleDeletedPost?: (channelId: string, rootId: string, post: Post) => void;
  channelId?: string;
  message?: string;
  token: string;
  connectedUserId: string;
}) {
  const [sendingMessage, setSendingMessage] = useState(false);

  /**
   * Manage the reaction socket event that just occurred
   * @param msg The socket msg, used to retrieve the right post and reaction information
   * @param add A boolean to know if we want to add or remove a reaction
   */
  const handleSocketReaction = useCallback(
    (msg: SocketMsg, add: boolean) => {
      const {data, broadcast} = msg;
      const reaction = JSON.parse(data.reaction);
      const {post_id} = reaction;
      const {channel_id, omit_users} = broadcast;
      if (!omit_users || !omit_users[connectedUserId]) {
        handleReaction && handleReaction(channel_id, post_id, reaction, add);
      }
    },
    [connectedUserId, handleReaction],
  );

  /**
   * Socket event management
   * @param msg Used to retrieve the event name and information
   */
  const handleSocketEvent = useCallback(
    (msg: any) => {
      /**
       * Remove a reaction to a post
       * @param msg Socket msg event
       */
      const handleReactionRemoved = (msg: any) => {
        handleSocketReaction(msg, false);
      };

      /**
       * Add a reaction to a post
       * @param msg Socket msg event
       */
      const handleReactionAdded = (msg: any) => {
        handleSocketReaction(msg, true);
      };
      const handleSocketNewPost = async (msg: any) => {
        const {data, broadcast} = msg;
        let post = JSON.parse(data.post);
        const {channel_id, root_id, user_id} = post;
        const {omit_users} = broadcast;
        if (
          // (!omit_users || (omit_users && !omit_users[connectedUserId])) &&
          // user_id !== connectedUserId
          !omit_users ||
          (omit_users && !omit_users[connectedUserId])
        ) {
          handleNewPost && handleNewPost(channel_id, root_id, post);
        }
      };

      const handleSocketPostDeleted = async (msg: any) => {
        const {data, broadcast} = msg;
        let post = JSON.parse(data.post);
        const {channel_id, root_id, user_id} = post;
        const {omit_users} = broadcast;
        if (
          // (!omit_users || (omit_users && !omit_users[connectedUserId])) &&
          // user_id !== connectedUserId
          !omit_users ||
          (omit_users && !omit_users[connectedUserId])
        ) {
          handleDeletedPost && handleDeletedPost(channel_id, root_id, post);
        }
      };

      /**
       * Handle the socket typing event
       * @param msg Socket msg event
       */
      const handleSocketTyping = (msg: any) => {
        const {data, broadcast} = msg;
        const {user_id} = data;
        const {channel_id, omit_users} = broadcast;
        if (!omit_users[connectedUserId]) {
          handleUserTyping && handleUserTyping(channel_id, user_id);
        }
      };
      switch (msg.event) {
        case SocketEvents.POSTED:
        case SocketEvents.EPHEMERAL_MESSAGE:
          void handleSocketNewPost(msg);
          break;

        case SocketEvents.TYPING:
          handleSocketTyping(msg);
          break;

        case SocketEvents.REACTION_ADDED:
          handleReactionAdded(msg);
          break;

        case SocketEvents.REACTION_REMOVED:
          handleReactionRemoved(msg);
          break;

        case SocketEvents.POST_DELETED:
          handleSocketPostDeleted(msg);
          break;

        default:
      }
    },
    [connectedUserId, handleSocketReaction, handleNewPost, handleUserTyping],
  );

  const initializeSocket = useCallback(() => {
    console.debug('init socket');
    if (!window.WebSocket) {
      return;
    }
    if (!socket) {
      socket = new WebSocketClient();
    }
    socket.addMessageListener(handleSocketEvent);
    if (!socket.isConnected()) {
      socket.initialize(getWebsocketURL(), token);
    }
  }, [token]);

  useEffect(() => {
    initializeSocket();
  }, [initializeSocket]);

  useEffect(() => {
    if (!sendingMessage && message) {
      socket.sendMessage('user_typing', {
        user_id: connectedUserId,
        channel_id: channelId,
      });
      setSendingMessage(true);
      setTimeout(() => {
        setSendingMessage(false);
      }, 4900);
    }
  }, [message, channelId, connectedUserId, sendingMessage]);
  return <div></div>;
}, isSocketEqual);
