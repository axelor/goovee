import dynamic from 'next/dynamic';
import {ComponentType} from 'react';

export const solidDuoIcons = [
  'BarChartTwo',
  'CloudGroup',
  'CloudNetwork',
  'Director',
  'EmployeesTwo',
  'Medal',
  'PenTool',
  'Script',
  'Server',
  'Setting',
  'TargetTwo',
] as const;

const iconMap: Record<string, ComponentType> = {
  BarChartTwo: dynamic(() => import('./BarChartTwo')),
  CloudGroup: dynamic(() => import('./CloudGroup')),
  CloudNetwork: dynamic(() => import('./CloudNetwork')),
  Director: dynamic(() => import('./Director')),
  EmployeesTwo: dynamic(() => import('./EmployeesTwo')),
  Medal: dynamic(() => import('./Medal')),
  PenTool: dynamic(() => import('./PenTool')),
  Script: dynamic(() => import('./Script')),
  Server: dynamic(() => import('./Server')),
  Setting: dynamic(() => import('./Setting')),
  TargetTwo: dynamic(() => import('./TargetTwo')),
};

export function getIcon(icon: string) {
  return iconMap[icon];
}
