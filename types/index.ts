import type {Tenant} from '@/tenant';
import type {Theme} from '@/types/theme';
import {BigDecimal} from '@goovee/orm';

export type ID = string | number;
export type Version = number;

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

export interface Model {
  id: ID;
  version: Version;
}

export type User = {
  id: ID;
  name: string;
  simpleFullName: string;
  email: string;
  isContact?: boolean;
  mainPartnerId?: string;
  tenantId: Tenant['id'];
  locale?: string;
};

export interface PortalWorkspace extends Model {
  name?: string;
  url: string;
  theme?: Theme;
  config?: PortalAppConfig;
  apps?: PortalApp[];
  workspaceUser?: Model;
  navigationSelect?: string;
  workspacePermissionConfig?: {
    id: ID;
  };
  logo: {
    id: ID;
  };
}

export interface PortalAppConfig extends Model {
  name: string;
  allowOnlinePaymentForEcommerce: boolean;
  allowOnlinePaymentForInvoices: boolean;
  byAToZ: boolean;
  byZToA: boolean;
  byFeature: boolean;
  byLessExpensive: boolean;
  byMostExpensive: boolean;
  byNewest: boolean;
  company: Company;
  confirmOrder: boolean;
  displayPrices: boolean;
  displayTwoPrices: string;
  mainPrice: string;
  eSignature: boolean;
  payInAdvance: boolean;
  priceAfterLogin: string;
  requestQuotation: boolean;
  paymentOptionSet?: Array<{}>;
  carouselList?: Array<{
    id: ID;
    title?: string;
    subTitle?: string;
    href?: string;
    image?: {id: ID};
    buttonLabel?: string;
  }>;
  canConfirmQuotation?: boolean;
  payQuotationToConfirm?: boolean;
  canPayInvoice?: 'no' | 'total' | 'partial';
  forumHeroTitle: string;
  forumHeroDescription: string;
  forumHeroBgImage: {
    id: string;
  };
  forumHeroOverlayColorSelect: OverlayColor;
  eventHeroTitle: string;
  eventHeroDescription: string;
  eventHeroOverlayColorSelect: OverlayColor;
  eventHeroBgImage: {
    id: string;
  };
  newsHeroTitle: string;
  newsHeroDescription: string;
  newsHeroOverlayColorSelect: OverlayColor;
  newsHeroBgImage: {
    id: string;
  };
  resourcesHeroTitle: string;
  resourcesHeroDescription: string;
  resourcesHeroOverlayColorSelect: OverlayColor;
  resourcesHeroBgImage: {
    id: string;
  };
  directoryHeroTitle: string;
  directoryHeroDescription: string;
  directoryHeroOverlayColorSelect: OverlayColor;
  directoryHeroBgImage: {
    id: string;
  };
  ticketHeroTitle: string;
  ticketHeroDescription: string;
  ticketHeroOverlayColorSelect: OverlayColor;
  ticketHeroBgImage: {
    id: string;
  };
  ticketStatusChangeMethod: string;
  allowGuestEventRegistration?: boolean;
  enableSocialMediaSharing?: boolean;
  enableComment?: boolean;
  enableNewsComment?: boolean;
  enableEventComment?: boolean;
  socialMediaSelect?: string;
  noMoreStockSelect?: number;
  outOfStockQty?: BigDecimal;
  defaultStockLocation?: any;
  nonPublicEmailNotFoundMessage?: string;
  enableRecommendedNews?: boolean;
  isShowAllTickets: boolean;
  isShowMyTickets: boolean;
  isShowManagedTicket: boolean;
  isShowCreatedTicket: boolean;
  isShowResolvedTicket: boolean;
  ticketingFieldSet: {id: string; name: string}[];
  ticketingFormFieldSet: {id: string; name: string}[];
  isDisplayChildTicket: boolean;
  isDisplayRelatedTicket: boolean;
  isDisplayTicketParent: boolean;
  isDisplayAssignmentBtn: boolean;
  isDisplayCancelBtn: boolean;
  isDisplayCloseBtn: boolean;
  otpTemplateList: any[];
  invitationTemplateList: any[];
  canInviteMembers?: boolean;
  isExistingContactsOnly?: boolean;
  isShowPublicationAuthor: boolean;
  isShowPublicationDate: boolean;
  isShowPublicationTime: boolean;
  isDisplayContact?: boolean;
  contactName?: string;
  contactEmailAddress?: {address?: string};
  contactPhone?: string;
  isCompanyOrAddressRequired?: boolean;
}

export interface PortalApp extends Model {
  name: string;
  code: string;
  installed: string;
  orderForMySpaceMenu: number;
  orderForTopMenu: number;
  showInMySpace: boolean;
  showInTopMenu: boolean;
}

export interface Product extends Model {
  name: string;
  code: string;
  slug: string;
  description?: string;
  thumbnailImage?: {id: string};
  images?: Array<string | number>;
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
  zip?: string;
}

export interface PartnerAddress extends Model {
  isDeliveryAddr: boolean;
  isInvoicingAddr: boolean;
  isDefaultAddr: boolean;
  address: Address;
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
    mainPrice?: PortalAppConfig['mainPrice'];
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
};

export interface Unit {
  id: ID;
  name: string;
}

export type Item = {
  key: string;
  label: string;
};

export type Participant = {
  id?: ID;
  name: string;
  surname: string;
  emailAddress: string;
  phone: string;
  contactAttrs?: string;
  subscriptionSet?: any[];
  company?: string;
  sequence: number;
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
  slug: string;
}

export interface WebsitePage extends Model {
  slug: string;
}

export interface WebsiteComponent extends Model {
  title?: string;
  code?: string;
}

export type PageInfo = {
  count: number | string;
  limit?: number | string;
  page?: number | string;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
};
