// ---- CORE IMPORTS ---- //
import {PageInfo} from '@/types';

export type NewsImage = {
  id: string;
  fileName?: string | null;
};

export type NewsCategory = {
  id: string;
  name: string;
  color?: string | null;
  parentCategory?: {
    id: string;
    name: string;
    color?: string | null;
    parentCategory?: {
      name: string;
      color?: string | null;
    } | null;
  } | null;
};

export type RawNewsCategory = {
  id: string | number;
  name: string;
  slug: string;
  image?: {id: string} | null;
  parentCategory?: {id: string | number} | null;
};

export type Attachment = {
  id: string;
  title?: string;
  metaFile?: {
    id: string;
    fileName: string;
    fileSize: number;
    sizeText: string;
    fileType: string;
  };
};

export type RelatedNewsItem = {
  id: string;
  title: string;
  slug: string;
  publicationDateTime: string;
  image?: NewsImage;
  categorySet?: NewsCategory[];
};

export type NewsItem = {
  id: string;
  title: string;
  description?: string;
  image?: NewsImage;
  slug: string;
  isPrivate?: boolean;
  publicationDateTime: string;
  categorySet?: NewsCategory[];
  attachmentList?: Attachment[];
  relatedNewsSet?: RelatedNewsItem[];
  content?: string;
  author?: {
    id?: string;
    simpleFullName?: string;
    picture?: {id: string};
  };
};

export type NewsResponse = {
  news: NewsItem[];
  pageInfo: PageInfo;
};
