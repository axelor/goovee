/**
 * APP
 */
export const APP_TEMPLATE_TITLE = 'Goovee';
export const DEFAULT_APP_TEMPLATE_TITLE = 'Portal | Goovee';
export const APP_DESCRIPTION = 'Next generation portal by Axelor';

/**
 * CURRENCY
 */
export const DEFAULT_CURRENCY_SYMBOL = '€';
export const DEFAULT_CURRENCY_CODE = 'EUR';

/**
 * SCALE
 */
export const DEFAULT_SCALE = 2;
export const DEFAULT_UNIT_PRICE_SCALE = 2;
export const DEFAULT_CURRENCY_SCALE = 2;

/**
 * TAX
 */
export const DEFAULT_TAX_VALUE = 0;

/**
 * LOCAL STORAGE
 */
export const PREFIX_CART_KEY = 'ct';

/**
 * QUERY
 */
export const DEFAULT_LIMIT = 12;
export const DEFAULT_PAGE = 1;
export const ORDER_BY = {
  ASC: 'ASC' as const,
  DESC: 'DESC' as const,
};

/**
 * TENANT
 */
export const DEFAULT_TENANT = 'd';

/**
 * WORKSPACE
 */
export const DEFAULT_WORKSPACE = 'w';
export const DEFAULT_WORKSPACE_URI = `/${DEFAULT_TENANT}/${DEFAULT_WORKSPACE}`;

/**
 * CUSTOMER ROLE
 */
export const ROLE = {
  TOTAL: 'total',
  RESTRICTED: 'restricted',
};

/**
 * SUBAPP CODES
 */
export enum SUBAPP_CODES {
  shop = 'shop',
  quotations = 'quotations',
  orders = 'orders',
  invoices = 'invoices',
  resources = 'resources',
  news = 'news',
  events = 'events',
  forum = 'forum',
  ticketing = 'ticketing',
  chat = 'chat',
  directory = 'directory',
  survey = 'survey',
  website = 'website',
}

/**
 * SUBAPP WITH ROLES
 */
export const SUBAPP_WITH_ROLES = [
  SUBAPP_CODES.quotations,
  SUBAPP_CODES.orders,
  SUBAPP_CODES.invoices,
  SUBAPP_CODES.ticketing,
];

/**
 * SUBAPP PAGE
 */
export const SUBAPP_PAGE = {
  orders: '/ongoing',
  completed: 'completed',
  archived: '/archived',
  unpaid: 'unpaid',
  paid: 'paid',
  checkout: `${SUBAPP_CODES.shop}/cart/checkout`,
  addresses: 'addresses',
  create: 'create',
  edit: 'edit',
  account: 'account',
  answerSurvey: 'answer',
  register: 'register',
  confirmation: 'confirmation',
  group: 'group',
  article: 'article',
};

/**
 * DATE FORMATS
 */
export const DATE_FORMATS = {
  timestamp_with_seconds: 'YYYY-MM-DD HH:mm:ss',
  timestamp_with_microseconds: 'YYYY-MM-DD HH:mm:ss.SSSSSS',
  iso_8601_utc_timestamp: 'YYYY-MM-DDTHH:mm[Z]',
  us_date: 'MM/DD/YYYY',
  full_month_day_year_12_hour: 'MMMM D YYYY - hA',
  custom: 'MMMM D YYYY - h:mm A',
  full_date: 'MMMM Do YYYY',
  DD_MM_YYYY: 'DD-MM-YYYY',
  MM_YYYY: 'MM-YYYY',
  YYYY: 'YYYY',
  hours_12_hour: 'hA',
};

/**
 * BANNER
 */

export const BANNER_TITLES = {
  resources: 'app-resources',
  news: 'app-news',
  events: 'app-events',
  forum: 'app-forum',
};
export const BANNER_DESCRIPTION =
  'Mi eget leo viverra cras pharetra enim viverra. Ac at non pretium etiam viverra. Ac at non pretium etiam';

export const IMAGE_URL = `/images/hero-bg.svg`;

/**
 * OTHERS
 */
export const NO_RESULTS_FOUND = 'No results found.';
export const DAY = 'day';
export const MONTH = 'month';
export const YEAR = 'year';

/**
 * URL
 */
export const URL_PARAMS = {
  page: 'page',
  sort: 'sort',
  search: 'search',
  searchid: 'searchid',
  category: 'category',
  date: 'date',
  query: 'query',
};

/**
 * NAVIGATION
 */
export const NAVIGATION = {
  top: 'topSide',
  left: 'leftSide',
};

/**
 * SEARCH PARAMS
 */

export const SEARCH_PARAMS = {
  TENANT_ID: 'tenant',
};

export const REPORT = 'Report';
export const NOT_INTERESTED = 'Not interested';
/**
 * REGISTRATION
 */

export const USER_CREATED_FROM = 'portal';

export const ALLOW_NO_REGISTRATION = 'no';
export const ALLOW_ALL_REGISTRATION = 'yesForAll';
export const ALLOW_AOS_ONLY_REGISTRATION = 'yesForAOS';

/**
 * RESPONSIVE SIZES
 */

export const RESPONSIVE_SIZES = ['xs', 'sm', 'md'] as const;

/**
 * Address
 */
export enum ADDRESS_TYPE {
  invoicing = 'invoicing',
  delivery = 'delivery',
}

/**
 * OUT OF STOCK
 */
export const OUT_OF_STOCK_TYPE = {
  ALLOW_BUY_WITH_NO_MESSAGE: 1,
  ALLOW_BUY_WITH_MESSAGE: 2,
  HIDE_PRODUCT_CANNOT_BUY: 3,
  DONT_ALLOW_BUY_WITH_MESSAGE: 4,
};

/**
 * KEY_TYPES
 */
export const KEY = {
  enter: 'Enter',
};

export const ModelMap: Partial<Record<SUBAPP_CODES, string>> = {
  [SUBAPP_CODES.forum]: 'com.axelor.apps.portal.db.ForumPost',
  [SUBAPP_CODES.news]: 'com.axelor.apps.portal.db.PortalNews',
  [SUBAPP_CODES.events]: 'com.axelor.apps.portal.db.PortalEvent',
  [SUBAPP_CODES.ticketing]: 'com.axelor.apps.project.db.ProjectTask',
  [SUBAPP_CODES.quotations]: 'com.axelor.apps.sale.db.SaleOrder',
};

/**
 * MODELS
 */
export const RELATED_MODELS = {
  SALE_ORDER: 'com.axelor.apps.sale.db.SaleOrder',
  INVOICE: 'com.axelor.apps.account.db.Invoice',
  STOCK_MOVE: 'com.axelor.apps.stock.db.StockMove',
};

export const INVOICE_ENTITY_TYPE = {
  ORDER: 'order',
  INVOICE: 'invoice',
  CUSTOMER_DELIVERY: 'customer_delivery',
};

export const NO_IMAGE_URL = '/images/no-image.png';
export const DEFAULT_LOGO_URL = `/images/default-logo.png`;
