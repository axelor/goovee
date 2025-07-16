import {ID} from '@/types';

export type MenuItem = {
  id: string;
  title: string;
  externalPage?: string;
  page?: {
    slug: string;
  };
  archived?: boolean;
  subMenuList?: MenuItem[];
};

export type Menu = {
  menuList: MenuItem[];
};

export type TemplateProps<T = any, M = any> = {
  data?: T;
  menu?: M;
  contentId?: ID;
  contentVersion?: number;
  workspaceURI: string;
  websiteSlug: string;
  websitePageSlug: string;
  code?: string;
};
