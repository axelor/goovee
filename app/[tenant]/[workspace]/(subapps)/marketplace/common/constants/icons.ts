import {
  FiActivity,
  FiArchive,
  FiAward,
  FiBarChart2,
  FiBell,
  FiBook,
  FiBookOpen,
  FiBox,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiCheckSquare,
  FiClipboard,
  FiClock,
  FiCloud,
  FiCode,
  FiCreditCard,
  FiDatabase,
  FiDollarSign,
  FiFileText,
  FiFolder,
  FiGift,
  FiGitBranch,
  FiGrid,
  FiHeadphones,
  FiImage,
  FiMail,
  FiMapPin,
  FiMessageSquare,
  FiMonitor,
  FiPackage,
  FiPhone,
  FiPieChart,
  FiRepeat,
  FiServer,
  FiSettings,
  FiShield,
  FiShoppingBag,
  FiShoppingCart,
  FiTarget,
  FiTrendingUp,
  FiTruck,
  FiUser,
  FiUserPlus,
  FiUsers,
  FiZap,
} from 'react-icons/fi';
import {
  LuBuilding2,
  LuClipboardCheck,
  LuFactory,
  LuPiggyBank,
  LuPlug,
  LuReceipt,
  LuScrollText,
  LuSparkles,
} from 'react-icons/lu';
import type {IconType} from 'react-icons';

/* `code` is what persists on the product as `iconCode`, and it names the
 * icon's purpose rather than its glyph, so a code survives a change of icon
 * set. This list is the whole registry — adding an entry here is all an icon
 * needs, and the codes below are also the product form's zod enum, so a new
 * entry extends validation with it. */
export const MARKETPLACE_ICONS = [
  {code: 'automation', labelKey: 'icon:Automation', Icon: FiZap},
  {code: 'analytics', labelKey: 'icon:Analytics', Icon: FiBarChart2},
  {code: 'dashboard', labelKey: 'icon:Dashboard', Icon: FiGrid},
  {code: 'reporting', labelKey: 'icon:Reporting', Icon: FiPieChart},
  {code: 'finance', labelKey: 'icon:Finance', Icon: FiDollarSign},
  {code: 'accounting', labelKey: 'icon:Accounting', Icon: FiBook},
  {code: 'invoicing', labelKey: 'icon:Invoicing', Icon: FiFileText},
  {code: 'payments', labelKey: 'icon:Payments', Icon: FiCreditCard},
  {code: 'sales', labelKey: 'icon:Sales', Icon: FiTrendingUp},
  {code: 'crm', labelKey: 'icon:CRM', Icon: FiUsers},
  {code: 'contacts', labelKey: 'icon:Contacts', Icon: FiUser},
  {code: 'marketing', labelKey: 'icon:Marketing', Icon: FiTarget},
  {code: 'inventory', labelKey: 'icon:Inventory', Icon: FiPackage},
  {code: 'warehouse', labelKey: 'icon:Warehouse', Icon: FiBox},
  {code: 'logistics', labelKey: 'icon:Logistics', Icon: FiTruck},
  {code: 'ecommerce', labelKey: 'icon:E-commerce', Icon: FiShoppingCart},
  {code: 'pos', labelKey: 'icon:Point of sale', Icon: FiShoppingBag},
  {code: 'manufacturing', labelKey: 'icon:Manufacturing', Icon: LuFactory},
  {code: 'project', labelKey: 'icon:Project', Icon: FiClipboard},
  {code: 'tasks', labelKey: 'icon:Tasks', Icon: FiCheckSquare},
  {code: 'calendar', labelKey: 'icon:Calendar', Icon: FiCalendar},
  {code: 'scheduling', labelKey: 'icon:Scheduling', Icon: FiClock},
  {code: 'hr', labelKey: 'icon:Human resources', Icon: FiBriefcase},
  {code: 'recruitment', labelKey: 'icon:Recruitment', Icon: FiUserPlus},
  {code: 'documents', labelKey: 'icon:Documents', Icon: FiFolder},
  {code: 'email', labelKey: 'icon:Email', Icon: FiMail},
  {code: 'messaging', labelKey: 'icon:Messaging', Icon: FiMessageSquare},
  {code: 'integration', labelKey: 'icon:Integration', Icon: LuPlug},
  {code: 'api', labelKey: 'icon:API / Developer', Icon: FiCode},
  {code: 'ai', labelKey: 'icon:AI', Icon: LuSparkles},
  {code: 'security', labelKey: 'icon:Security', Icon: FiShield},
  {code: 'helpdesk', labelKey: 'icon:Helpdesk', Icon: FiHeadphones},
  {code: 'database', labelKey: 'icon:Database', Icon: FiDatabase},
  {code: 'cloud', labelKey: 'icon:Cloud', Icon: FiCloud},
  {code: 'settings', labelKey: 'icon:Settings', Icon: FiSettings},
  {code: 'quality', labelKey: 'icon:Quality', Icon: FiAward},
  {code: 'locations', labelKey: 'icon:Locations', Icon: FiMapPin},
  {code: 'notifications', labelKey: 'icon:Notifications', Icon: FiBell},
  {code: 'workflow', labelKey: 'icon:Workflow', Icon: FiGitBranch},
  {code: 'approvals', labelKey: 'icon:Approvals', Icon: FiCheckCircle},
  {code: 'forecasting', labelKey: 'icon:Forecasting', Icon: FiActivity},
  {code: 'budget', labelKey: 'icon:Budget', Icon: LuPiggyBank},
  {code: 'subscriptions', labelKey: 'icon:Subscriptions', Icon: FiRepeat},
  {code: 'contracts', labelKey: 'icon:Contracts', Icon: LuScrollText},
  {code: 'expenses', labelKey: 'icon:Expenses', Icon: LuReceipt},
  {code: 'purchasing', labelKey: 'icon:Purchasing', Icon: LuClipboardCheck},
  {code: 'assets', labelKey: 'icon:Assets', Icon: LuBuilding2},
  {code: 'knowledge', labelKey: 'icon:Knowledge base', Icon: FiBookOpen},
  {code: 'monitoring', labelKey: 'icon:Monitoring', Icon: FiMonitor},
  {code: 'infrastructure', labelKey: 'icon:Infrastructure', Icon: FiServer},
  {code: 'backup', labelKey: 'icon:Backup', Icon: FiArchive},
  {code: 'telephony', labelKey: 'icon:Telephony', Icon: FiPhone},
  {code: 'media', labelKey: 'icon:Media', Icon: FiImage},
  {code: 'loyalty', labelKey: 'icon:Loyalty', Icon: FiGift},
] as const satisfies readonly {
  code: string;
  labelKey: string;
  Icon: IconType;
}[];

export type IconCode = (typeof MARKETPLACE_ICONS)[number]['code'];

export const ICON_CODES: readonly IconCode[] = MARKETPLACE_ICONS.map(
  ({code}) => code,
);

const ICON_CODE_SET: ReadonlySet<string> = new Set(ICON_CODES);

/* Narrows a code read back from the database, which is a plain string and need
 * not belong to the catalogue. */
export function isIconCode(code: string | null | undefined): code is IconCode {
  return !!code && ICON_CODE_SET.has(code);
}

/* Typed Record<string, IconType> on purpose: callers index it with raw DB
 * strings, and an unknown code must miss rather than fail to compile. */
export const MARKETPLACE_ICON_MAP: Record<string, IconType> =
  Object.fromEntries(MARKETPLACE_ICONS.map(({code, Icon}) => [code, Icon]));

export const DEFAULT_ICON_CODE = MARKETPLACE_ICONS[0].code;
