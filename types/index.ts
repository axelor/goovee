import type {MainPriceConfig} from '@/orm/workspace';

export type ID = string;
export type Version = number;

export interface Model {
  id: ID;
  version: Version;
}

export type OverlayColor =
  | 'default'
  | 'red'
  | 'pink'
  | 'purple'
  | 'deeppurple'
  | 'indigo'
  | 'blue'
  | 'lightblue'
  | 'cyan'
  | 'teal'
  | 'green'
  | 'lightgreen'
  | 'lime'
  | 'yellow'
  | 'amber'
  | 'orange'
  | 'deeporange'
  | 'brown'
  | 'grey'
  | 'bluegrey'
  | 'black'
  | 'white';

export type User = {
  id: string;
  name: string | null;
  email: string;
  isContact: boolean | null;
  simpleFullName: string | null;
  mainPartnerId: string | undefined;
  partnerCategoryId: string | undefined;
  tenantId: string | null | undefined;
  locale: string | null | undefined;
  image: string | null | undefined;
};

export interface Product extends Model {
  name: string;
  code: string;
  slug: string;
  description?: string;
  thumbnailImage?: {id: string};
  images?: Array<string>;
  salePrice: number;
  costPrice: number;
  featured?: number;
  createdOn?: string;
  saleCurrency?: Currency;
  displaySalePrice: string;
  displayCostPrice: string;
  allowCustomNote?: boolean;
  productAttrs: string;
  outOfStockConfig?: {
    canBuy: boolean;
    noMoreStockSelect: number;
    outOfStock: boolean;
    showMessage: boolean;
  };
  portalCategorySet?: Array<{
    id: ID;
    name?: string | null;
    slug?: string | null;
  }>;
  productCategory?: {
    id: ID;
    name?: string | null;
    slug?: string | null;
  } | null;
  picture?: {id: string} | null;
  portalImageList?: Array<{picture?: {id: string} | null}> | null;
}

export interface PortalAddress {
  id?: string | number | null;
  version?: number;
  addressl2?: string | null;
  addressl4?: string | null;
  addressl6?: string | null;
  zip?: string | null;
  townName?: string | null;
  streetName?: string | null;
  companyName?: string | null;
  department?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  formattedFullName?: string | null;
  country?: {
    id: string | number;
    name?: string | null;
    version?: number;
  } | null;
}

export interface PartnerAddress {
  id: string | number;
  version?: number;
  isInvoicingAddr?: boolean | null;
  isDeliveryAddr?: boolean | null;
  isDefaultAddr?: boolean | null;
  isDefaultDelivery?: boolean | null;
  isDefaultInvoicing?: boolean | null;
  address?: PortalAddress | null;
}

export interface Currency extends Model {
  name: string;
  code: string;
  symbol: string;
  numberOfDecimals: number;
}

export interface Cart extends Model {
  items: CartItem[];
}

export interface CartItem extends Model {
  quantity: string | number;
  cart: Cart['id'];
  product: Product['id'];
  note?: string;
}

export interface Partner extends Model {
  name: string;
  firstName?: string;
}

export interface City extends Model {
  name: string;
}

export interface Country extends Model {
  name: string;
}

export interface Address extends Model {
  addressl2?: string;
  addressl3?: string;
  addressl4?: string;
  addressl5?: string;
  addressl6?: string;
  country?: Country;
  city?: City;
  townName?: string;
  zip?: string;
  streetName?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  fullName?: string;
  formattedFullName?: string;
  countrySubDivision?: string;
  department?: string;
}

export interface Company extends Model {
  name: string;
  logo: {
    id: ID;
  };
}

export interface Localization extends Model {
  name: string;
  code: string;
  isAvailableOnPortal?: boolean;
}

export type ComputedProduct = {
  product: Product;
  scale: {
    unit: number;
    currency: number;
  };
  tax: {
    value: number;
  };
  price: {
    ati?: number | string;
    wt?: number | string;
    primary?: number | string;
    secondary?: number | string;
    displayAti?: string;
    displayWt?: string;
    displayPrimary?: string;
    displaySecondary?: string;
    mainPrice?: MainPriceConfig['mainPrice'];
    displayTwoPrices?: boolean;
  };
  currency: Currency;
  errorMessage?: string;
};

export type MetaFile = {
  id: ID;
  fileName: string;
  fileType?: string;
};

export type Category = {
  name: string;
  slug: string;
  id: number | string;
  items?: Category[];
  parent?: {id: number | string} | null;
};

export interface Unit {
  id: ID;
  name: string;
}

export type Item = {
  key: string;
  label: string;
};

export type Comment = {
  image?: any;
  contentComment: string;
  publicationDateTime: Date;
};

export enum PaymentOption {
  paypal = 'paypal',
  stripe = 'stripe',
  paybox = 'paybox',
  up2pay = 'up2pay',
  hubpisp = 'hubpisp',
}

export interface CommentResponse {
  success?: boolean;
  error?: boolean;
  message?: string;
  data?: any;
}

export enum PartnerKey {
  CLIENT_PARTNER = 'clientPartner',
  PARTNER = 'partner',
}

export interface MainWebsite extends Model {}

export interface Website extends Model {
  slug: string | null;
}

export interface WebsitePage extends Model {
  slug: string | null;
}

export interface WebsiteComponent extends Model {
  title?: string | null;
  code?: string | null;
}

export type PageInfo = {
  count: number | string;
  limit?: number | string;
  page?: number | string;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type EntityWhereClause = {
  clientPartner?: {id: string};
  partner?: {id: string};
  contactPartner?: {id: string};
};
