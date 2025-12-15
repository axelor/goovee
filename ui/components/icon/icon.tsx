'use client';

import {IconType} from 'react-icons';
import {
  MdErrorOutline,
  MdOutlineCheckCircle,
  MdOutlineWarningAmber,
  MdStorefront,
  MdAppRegistration,
  MdReceiptLong,
  MdOutlineReceiptLong,
  MdPayment,
  MdOutlineNewspaper,
  MdOutlineEvent,
  MdOutlineForum,
  MdOutlineLiveHelp,
  MdFolder,
  MdOutlineAssessment,
  MdOutlineShoppingBag,
  MdAccountCircle,
  MdOutlineWeb,
  MdOutlineHome,
} from 'react-icons/md';

import {FaShareAltSquare} from 'react-icons/fa';
import {GiDiscussion} from 'react-icons/gi';

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
  website: IconType;
  survey: IconType;
  account: IconType;
  chat: IconType;
  home: IconType;
}

function getIcon(type: keyof IconMapping): IconType | undefined {
  const iconMapping: IconMapping = {
    storeFront: MdStorefront,
    toastSuccess: MdOutlineCheckCircle,
    toastError: MdErrorOutline,
    toastWarning: MdOutlineWarningAmber,
    toastPrimary: MdErrorOutline,
    shop: MdOutlineShoppingBag,
    quotation: MdOutlineReceiptLong,
    invoice: MdPayment,
    order: MdReceiptLong,
    resource: FaShareAltSquare,
    app: MdAppRegistration,
    newspaper: MdOutlineNewspaper,
    event: MdOutlineEvent,
    forum: GiDiscussion,
    ticketing: MdOutlineLiveHelp,
    directory: MdFolder,
    survey: MdOutlineAssessment,
    account: MdAccountCircle,
    website: MdOutlineWeb,
    chat: MdOutlineForum,
    home: MdOutlineHome,
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
