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
  lineId?: ID;
  contentId?: ID;
  contentVersion?: number;
  workspaceURI: string;
  websiteSlug: string;
  websitePageSlug?: string;
  code?: string;
  mountType: MountType;
  canEditWiki?: boolean;
};

export type MountType = 'page' | 'footer' | 'header' | 'menu';
export type LayoutMountType = Exclude<MountType, 'page'>;
