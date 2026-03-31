import type {ID} from '@/types';

/**
 * The tag is forwarded to the browser's showNotification() API — notifications
 * sharing the same tag replace each other in the OS tray instead of stacking.
 * Each factory produces a tag scoped to a specific record so only notifications
 * about the *same* post/ticket/etc collapse together.
 */
export const NotificationTag = {
  /** New post created in a forum group — one notification per group. */
  forumNewPost: (postId: ID) => `forum:post:${postId}:new`,

  /** New top-level comment on a forum post — collapses per post. */
  forumPostComment: (postId: ID) => `forum:post:${postId}:comment`,

  /** Reply to a specific forum comment — collapses per parent comment. */
  forumReply: (commentId: ID) => `forum:comment:${commentId}:reply`,

  /** New top-level comment on a ticket — collapses per ticket. */
  ticketComment: (ticketId: ID) => `ticket:${ticketId}:comment`,

  /** Reply to a specific ticket comment — collapses per parent comment. */
  ticketReply: (commentId: ID) => `ticket:comment:${commentId}:reply`,

  /** Ticket created or updated — collapses per ticket. */
  ticketUpdate: (ticketId: ID) => `ticket:${ticketId}:update`,

  /** Event registration confirmation — one per event. */
  event: (eventId: ID) => `event:${eventId}`,

  /** System/webhook notification — collapses per app. */
  system: (appName: string) => `system:${appName}`,
} as const;
