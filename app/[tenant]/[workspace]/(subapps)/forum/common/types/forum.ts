import {IconType} from 'react-icons';

export type ID = string;
export type Version = number;

export interface Model {
  id: ID;
  version: Version;
}

export interface TextAlignment {
  name: 'left' | 'center' | 'right' | 'justify';
  icon: IconType;
}
export type Level = 1 | 2 | 3 | 4 | 5 | 6;

export type PostsContentProps = {
  posts: any;
  pageInfo: any;
};
export type MediaContentProps = {
  groupId: string;
};

export type Tab<P = {}> = {
  id: number;
  key: string;
  title: string;
  icon: IconType;
  component: React.ComponentType<P>;
};

export type MetaFile = {
  id: ID;
  fileName: string;
};

export interface Image extends Model {
  metaFile: MetaFile;
}

export interface ForumGroup extends Group {
  name: string;
  description?: string;
  image?: Image;
}

export interface Group extends Model {
  isPin?: boolean;
  notificationSelect: string | null;
  forumGroup: ForumGroup;
  name?: string | null;
}

export interface Author extends Model {
  simpleFullName?: string;
  picture: {id: string};
}

export interface Comment extends Model {
  contentComment?: string;
  publicationDateTime?: string;
  author: Author;
  childComment: Comment[];
}

export interface Post extends Model {
  title?: string;
  content?: string;
  forumGroup: ForumGroup;
  attachmentList: [];
  commentList: Comment[];
  author: Author;
  createdOn: string;
}

export interface RecentlyActivePost {
  id: ID;
  version: Version;
  title: string;
  comment: {
    id: ID;
    version: Version;
    note: string;
    createdOn: string;
    partner?: {id: ID; version: Version; name: string; simpleFullName?: string};
    createdBy?: {id: ID; version: Version; name: string; fullName?: string};
  };
}

export enum ContentType {
  POST = 'post',
  COMMENT = 'comment',
}

export interface Subscriber {
  notificationSelect: string;
  member: {
    id: string | number;
    emailAddress: {
      address: string;
    };
    simpleFullName: string;
  };
}

export interface NotificationParams {
  type: ContentType;
  title: string;
  content: string;
  author: {id: string | number; simpleFullName: string};
  group: {name: string};
  subscribers: Subscriber[];
  link: string;
  postAuthor?: {id: string | number};
}

export interface MailTemplateParams {
  type: ContentType;
  title: string;
  author: {simpleFullName: string};
  group: {name: string};
  contentSnippet: string;
  link: string;
  user: string;
}
