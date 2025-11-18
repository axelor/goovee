'use client';
import L from 'leaflet';
import {memo, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';

import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES} from '@/constants';

import {Card} from '../card';
import {MapContentProps} from './types';

import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css'; // Re-uses images from ~leaflet package
import 'leaflet/dist/leaflet.css';

type Popup = {
  el: HTMLElement;
  item: MapContentProps['items'][number];
};

export const Map = memo((props: MapContentProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [popup, setPopup] = useState<Popup | null>(null);
  const {className, center, zoom, items, small} = props;
  const {workspaceURI, tenant} = useWorkspace();

  useLayoutEffect(() => {
    if (!mapRef.current) return;
    const map = new L.Map(mapRef.current, {
      center: [center.lat, center.lng],
      zoom,
    });
    // add tile layer with attribution. Without tile layer, the map will not be displayed
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    items.forEach(item => {
      const popupEl = document.createElement('div');
      L.marker([
        Number(item.mainAddress?.latit),
        Number(item.mainAddress?.longit),
      ])
        .bindPopup(popupEl, {
          minWidth: small ? 300 : 500,
          className: '[&_.leaflet-popup-content]:m-0',
        })
        .on('popupopen', () => setPopup({el: popupEl, item}))
        .addTo(map);
    });

    return () => {
      map.off();
      map.remove();
    };
    //NOTE: className is added to trigger a re-render if it affects the map's dimensions.
  }, [zoom, center, items, small, className]);

  return (
    <>
      <div ref={mapRef} className={className} />
      {popup &&
        createPortal(
          <Card
            item={popup.item}
            url={`${workspaceURI}/${SUBAPP_CODES.directory}/entry/${popup.item.id}`}
            compact={small}
            tenant={tenant}
            className="hover:bg-accent"
          />,
          popup.el,
        )}
    </>
  );
});

Map.displayName = 'Map';
