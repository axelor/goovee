export type ID = string;
export type Version = number;

export interface Model {
  id: ID;
  version: Version;
}

interface Attachment {
  id?: ID;
  title?: string;
  metaFile: Partial<MetaFile> & {fileType?: string};
}

export interface MenuItem {
  id: number;
  name: string;
  link: string;
}

export interface SearchResult {
  id: ID;
  title: string;
  content?: string;
  forumGroup: {id: ID; name: string};
  label: string;
}

export type MetaFile = {
  id: ID;
  fileName: string;
};

export interface Image extends Model {
  metaFile: MetaFile;
}

export interface Group extends Model {
  name: string;
  description?: string;
  image?: Image;
}

export interface MemberGroup extends Model {
  isPin?: boolean;
  notificationSelect: string | null;
  forumGroup: Group;
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
  postDateT?: string;
  forumGroup: Group;
  attachmentList: Attachment[];
  commentList: Comment[];
  author: Author;
  createdOn: string;
}

export type PostWithMembership = Post & {isMember: boolean};

export interface RecentlyActivePost {
  id: ID;
  version: Version;
  title: string;
  forumGroup: {id: ID; version: Version; name: string};
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
  notificationSelect: string | null;
  member: {
    id: ID;
    emailAddress: {
      address: string | null;
    } | null;
    simpleFullName: string | null;
    localization?: {code: string | null} | null;
  } | null;
}

export interface NotificationParams {
  type: ContentType;
  title: string;
  content: string;
  author: {id: ID; simpleFullName: string};
  group: {name: string};
  subscribers: Subscriber[];
  link: string;
  postAuthor?: {id: ID};
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
