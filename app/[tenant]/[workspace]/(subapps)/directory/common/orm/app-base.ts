import {t} from '@/lib/core/locale/server';
import {manager, type Tenant} from '@/lib/core/tenant';

import {MAP_SELECT} from '../constants';
import type {MapConfig} from '../types';

export async function findMapConfig({
  tenantId,
}: {
  tenantId: Tenant['id'];
}): Promise<MapConfig> {
  if (!tenantId) {
    throw new Error(await t('Missing required parameters'));
  }
  const c = await manager.getClient(tenantId);

  const mapConfig = await c.aOSAppBase.findOne({
    where: {OR: [{archived: false}, {archived: null}]},
    select: {
      mapApiSelect: true,
      googleMapsApiKey: true,
    },
  });

  if (mapConfig?.mapApiSelect === MAP_SELECT.GoogleMaps) {
    return {map: MAP_SELECT.GoogleMaps, apiKey: mapConfig.googleMapsApiKey};
  }

  return {map: MAP_SELECT.OpenStreetMap};
}
