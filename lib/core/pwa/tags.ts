import type {ID} from '@/types';

/**
 * The tag is forwarded to the browser's showNotification() API — a new
 * notification with the same tag replaces the previous one in the OS tray
 * instead of stacking. Each factory produces a tag scoped to a specific
 * record so only notifications about the *same* post/ticket/etc replace
 * each other.
 */
export const NotificationTag = {
  /** New post in a forum group */
  forumNewPost: (postId: ID) => `forum:post:${postId}:new`,

  /** New top-level comment on a forum post */
  forumPostComment: (postId: ID) => `forum:post:${postId}:comment`,

  /** Reply to a forum comment */
  forumReply: (commentId: ID) => `forum:comment:${commentId}:reply`,

  /** New top-level comment on a ticket */
  ticketComment: (ticketId: ID) => `ticket:${ticketId}:comment`,

  /** Reply to a ticket comment */
  ticketReply: (commentId: ID) => `ticket:comment:${commentId}:reply`,

  /** Ticket created or updated */
  ticketUpdate: (ticketId: ID) => `ticket:${ticketId}:update`,

  /** Reply to an event comment */
  eventReply: (commentId: ID) => `event:comment:${commentId}:reply`,

  /** Reply to a quotation comment */
  quotationReply: (commentId: ID) => `quotation:comment:${commentId}:reply`,

  /** Reply to a news comment */
  newsReply: (commentId: ID) => `news:comment:${commentId}:reply`,

  /** Invoice payment received (bank transfer) */
  invoicePayment: (invoiceId: ID) => `invoice:${invoiceId}:payment`,

  /** Event registration confirmation */
  event: (eventId: ID) => `event:${eventId}`,

  /**
   * System/webhook notification — scoped by workspaceId because the same app name
   * can exist across multiple workspaces, unlike forum/ticket/event entities which
   * are already unique to a single workspace.
   */
  system: (appName: string, workspaceId: string) =>
    `ws:${workspaceId}:system:${appName}`,
} as const;
