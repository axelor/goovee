'use client';
import dynamic from 'next/dynamic';
import {useCallback, useMemo, useState} from 'react';
import {MdCloseFullscreen, MdOpenInFull} from 'react-icons/md';

import {RESPONSIVE_SIZES} from '@/constants';
import type {Cloned} from '@/types/util';
import {Button} from '@/ui/components';
import {useResponsive} from '@/ui/hooks';
import {cn} from '@/utils/css';

import {MAP_SELECT} from '../../../constants';
import type {Entry, ListEntry, MapConfig} from '../../../types';
import {MapSkeleton} from './map-skeleton';
import {calculateZoom} from './utils';

const MAP_HEIGHT = 320; // h-80
const MAP_WIDTH = 384; // w-96

const GoogleMap = dynamic(() => import('./google-map').then(mod => mod.Map), {
  ssr: false,
  loading: MapSkeleton,
});

const OpenMap = dynamic(() => import('./open-map').then(mod => mod.Map), {
  ssr: false,
  loading: MapSkeleton,
});

export type MapProps = {
  className?: string;
  showExpand?: boolean;
  entries: Cloned<Entry>[] | Cloned<ListEntry>[];
  config: MapConfig;
};

export function Map(props: MapProps) {
  const {className, showExpand, entries, config} = props;
  const [expand, setExpand] = useState(false);
  const mapEntries = useMemo(
    () => entries.filter(x => x.mainAddress?.longit && x.mainAddress?.latit),
    [entries],
  );
  const res = useResponsive();
  const small = RESPONSIVE_SIZES.some(x => res[x]);
  const full = small || expand;

  const {defaultCenter, defaultZoom} = useMemo(() => {
    const lats = mapEntries.map(entry => Number(entry.mainAddress?.latit));
    const lngs = mapEntries.map(entry => Number(entry.mainAddress?.longit));

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const defaultCenter = {
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2,
    };

    const defaultZoom = calculateZoom({
      mapWidth: MAP_WIDTH,
      mapHeight: MAP_HEIGHT,
      minLat,
      maxLat,
      minLng,
      maxLng,
    });

    return {defaultCenter, defaultZoom};
  }, [mapEntries]);

  const toggleExpand = useCallback(() => {
    setExpand(expand => !expand);
  }, []);

  const MapComponent =
    config.map === MAP_SELECT.GoogleMaps ? GoogleMap : OpenMap;

  const Icon = expand ? MdCloseFullscreen : MdOpenInFull;
  return (
    // NOTE: expand class is applied when the map is expanded and when it is in mobile view
    <div className={cn('relative', full && 'expand')}>
      {!!mapEntries.length && (
        <>
          <MapComponent
            className={cn(
              full ? 'h-[min(45rem,80dvh)] w-full' : 'h-80 w-96',
              className,
            )}
            apiKey={config.apiKey}
            items={mapEntries}
            zoom={defaultZoom}
            center={defaultCenter}
            small={small || !expand}
          />
          {showExpand && !small && (
            <Button
              style={{zIndex: 1000}}
              variant="ghost"
              className="bg-accent absolute top-2 right-2"
              onClick={toggleExpand}>
              <Icon size={18} />
            </Button>
          )}
        </>
      )}
    </div>
  );
}
