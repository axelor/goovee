// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import type {ID} from '@/types';
import type {ActionResponse} from '@/types/action';
import type {Cloned} from '@/types/util';

// ---- LOCAL IMPORTS ---- //
import type {MAIL_MESSAGE_TYPE} from '../constants';
import type {
  Comment,
  CommentData,
  CreateCommentProps,
  FetchCommentsProps,
  Track,
} from '../utils/validators';

export type {
  AttachmentFile,
  Comment,
  CommentAttachment,
  CommentData,
  CreateCommentProps,
  FetchCommentsProps,
  MailMessage,
  MailMessageFile,
  Partner,
  Picture,
  User,
  TrackObject,
  Track,
} from '../utils/validators';

export type TrackingField = 'body' | 'publicBody';
export type CommentField = 'note' | 'body';

export type CreateComment = (
  props: CreateCommentProps,
) => ActionResponse<Cloned<[Comment, Comment | undefined]>>;

export type AddCommentProps = {
  client: Client;
  userId: ID;
  recordId: ID;
  workspaceUserId: ID;
  modelName: string;
  subject: string;
  trackingField: TrackingField;
  commentField: CommentField;
  parentId?: ID;
  messageBody?: {
    title: string;
    tracks: Track[];
    tags: any[];
  };
  data?: CommentData;
  messageType?: MAIL_MESSAGE_TYPE;
  showRepliesInMainThread?: boolean;
};

export type FindCommentsData = {
  comments: Comment[];
  total: number;
  totalCommentThreadCount: number;
};

export type FindCommentsProps = {
  client: Client;
  recordId: ID;
  modelName: string;
  trackingField: TrackingField;
  commentField: CommentField;
  limit?: number;
  skip?: number;
  sort?: any;
  exclude?: ID[];
  showRepliesInMainThread?: boolean;
};

export type FetchComments = (
  props: FetchCommentsProps,
) => ActionResponse<Cloned<FindCommentsData>>;

export type CreateProps = {
  data: CommentData;
  parent?: ID;
};
