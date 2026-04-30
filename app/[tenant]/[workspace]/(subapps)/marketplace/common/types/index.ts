export type MarketplaceProductVersion = {
  id: string;
  version: string;
  releaseNotes?: string | null;
  releaseDate?: string | null;
  isLatest: boolean;
};

export type MarketplaceProduct = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  longDescription?: string | null;
  salePrice: number;
  saleCurrency?: {id: string; symbol: string} | null;
  thumbnailImage?: {id: string} | null;
  picture?: {id: string} | null;
  portalImageList?: {id: string; picture: {id: string}}[] | null;
  defaultSupplierPartner?: {id: string; name: string} | null;
  portalCategorySet?: {id: string; name: string; slug: string}[] | null;
  marketplaceStatusSelect: 'draft' | 'submitted' | 'approved' | 'published' | 'rejected';
  marketplaceVersionList?: MarketplaceProductVersion[] | null;
  createdOn?: string | null;
};

export type MarketplaceCategory = {
  id: string;
  name: string;
  slug: string;
  subtitle?: string | null;
  portalImage?: {id: string} | null;
};

export type VersionDraftRow = {
  _key: string;
  version: string;
  releaseNotes: string;
  releaseDate: string;
  isLatest: boolean;
  file: File | null;
  fileName: string;
};

export type ProductView = 'grid' | 'list';

export type SearchParams = {
  search?: string;
  view?: ProductView;
  page?: string;
  sort?: string;
};
