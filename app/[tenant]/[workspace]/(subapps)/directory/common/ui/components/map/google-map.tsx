'use client';
import {
  APIProvider,
  Map as GMap,
  InfoWindow,
  Marker as MarkerComponent,
  useMarkerRef,
} from '@vis.gl/react-google-maps';
import {useCallback, useState} from 'react';

import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import type {Cloned} from '@/types/util';
import {SUBAPP_CODES} from '@/constants';

import type {Entry, ListEntry} from '../../../types';
import {Card} from '../card';
import type {MapContentProps} from './types';

export function Map(props: MapContentProps) {
  const {apiKey, ...rest} = props;
  return (
    <APIProvider apiKey={apiKey ?? ''}>
      <MapContent {...rest} />
    </APIProvider>
  );
}

function MapContent(props: MapContentProps) {
  const {className, center, zoom, items, small} = props;

  return (
    <GMap
      className={className}
      reuseMaps={true}
      defaultCenter={center}
      defaultZoom={zoom}
      gestureHandling="greedy"
      disableDefaultUI={true}>
      {items?.map(item => {
        return <Marker key={item.id} small={small} item={item} />;
      })}
    </GMap>
  );
}

type MarkerProps = {
  small: boolean;
  item: Cloned<Entry> | Cloned<ListEntry>;
};

export function Marker(props: MarkerProps) {
  const {small, item} = props;
  const {workspaceURI, tenant} = useWorkspace();

  const url = `${workspaceURI}/${SUBAPP_CODES.directory}/entry/${item.id}`;
  const [markerRef, marker] = useMarkerRef();

  const [show, setShow] = useState(false);
  const toggle = useCallback(() => setShow(show => !show), []);
  const handleClose = useCallback(() => setShow(false), []);

  return (
    <>
      <MarkerComponent
        ref={markerRef}
        position={{
          lat: Number(item.mainAddress?.latit || 0),
          lng: Number(item.mainAddress?.longit || 0),
        }}
        onClick={toggle}
      />
      {show && (
        <InfoWindow anchor={marker} onClose={handleClose} headerDisabled>
          <Card
            item={item}
            url={url}
            compact={small}
            tenant={tenant}
            className="hover:bg-accent"
          />
        </InfoWindow>
      )}
    </>
  );
}
