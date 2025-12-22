import dynamic from 'next/dynamic';
import {ComponentType} from 'react';

export const solidMonoIcons = [
  'Alarm',
  'Building',
  'Bulb',
  'Code',
  'Compare',
  'DeliveryBox',
  'Devices',
  'Edit',
  'Employees',
  'GlobeTwo',
  'Headphone',
  'Lamp',
  'PartnerShip',
  'PushCart',
  'Puzzle',
  'Share',
  'Shipment',
  'Target',
  'Team',
  'TeamTwo',
  'Verify',
  'VideoCall',
  'VideoChat',
  'Wallet',
] as const;

const iconMap: Record<string, ComponentType> = {
  Alarm: dynamic(() => import('./Alarm')),
  Building: dynamic(() => import('./Building')),
  Bulb: dynamic(() => import('./Bulb')),
  Code: dynamic(() => import('./Code')),
  Compare: dynamic(() => import('./Compare')),
  DeliveryBox: dynamic(() => import('./DeliveryBox')),
  Devices: dynamic(() => import('./Devices')),
  Edit: dynamic(() => import('./Edit')),
  Employees: dynamic(() => import('./Employees')),
  GlobeTwo: dynamic(() => import('./GlobeTwo')),
  Headphone: dynamic(() => import('./Headphone')),
  Lamp: dynamic(() => import('./Lamp')),
  PartnerShip: dynamic(() => import('./PartnerShip')),
  PushCart: dynamic(() => import('./PushCart')),
  Puzzle: dynamic(() => import('./Puzzle')),
  Share: dynamic(() => import('./Share')),
  Shipment: dynamic(() => import('./Shipment')),
  Target: dynamic(() => import('./Target')),
  Team: dynamic(() => import('./Team')),
  TeamTwo: dynamic(() => import('./TeamTwo')),
  Verify: dynamic(() => import('./Verify')),
  VideoCall: dynamic(() => import('./VideoCall')),
  VideoChat: dynamic(() => import('./VideoChat')),
  Wallet: dynamic(() => import('./Wallet')),
};

export function getIcon(icon: string) {
  return iconMap[icon];
}

