'use client';

import {IconType} from 'react-icons';
import {
  MdErrorOutline,
  MdOutlineCheckCircle,
  MdOutlineWarningAmber,
  MdStorefront,
  MdAppRegistration,
  MdDocumentScanner,
  MdShoppingBag,
  MdReceiptLong,
  MdOutlineReceipt,
  MdPayment,
  MdNewspaper,
  MdEvent,
  MdOutlineForum,
  MdListAlt,
  MdFolder,
  MdOutlinePoll,
  MdAccountCircle,
} from 'react-icons/md';

interface IconMapping {
  storeFront: IconType;
  toastSuccess: IconType;
  toastError: IconType;
  toastWarning: IconType;
  toastPrimary: IconType;
  shop: IconType;
  quotation: IconType;
  invoice: IconType;
  order: IconType;
  resource: IconType;
  app: IconType;
  newspaper: IconType;
  event: IconType;
  forum: IconType;
  ticketing: IconType;
  directory: IconType;
  survey: IconType;
  account: IconType;
}

function getIcon(type: keyof IconMapping): IconType | undefined {
  const iconMapping: IconMapping = {
    storeFront: MdStorefront,
    toastSuccess: MdOutlineCheckCircle,
    toastError: MdErrorOutline,
    toastWarning: MdOutlineWarningAmber,
    toastPrimary: MdErrorOutline,
    shop: MdShoppingBag,
    quotation: MdOutlineReceipt,
    invoice: MdPayment,
    order: MdReceiptLong,
    resource: MdDocumentScanner,
    app: MdAppRegistration,
    newspaper: MdNewspaper,
    event: MdEvent,
    forum: MdOutlineForum,
    ticketing: MdListAlt,
    directory: MdFolder,
    survey: MdOutlinePoll,
    account: MdAccountCircle,
  };

  const icon = iconMapping[type];

  return icon;
}

export const Icon = ({
  name,
  className,
  size,
  onClick,
  ...rest
}: {
  name: any;
  className?: string;
  size?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) => {
  let IconComponent: any = getIcon(name);

  if (!IconComponent) {
    return null;
  }

  return <IconComponent className={`${className}`} {...rest} />;
};

export default Icon;
