'use client';

import React, {useEffect, useRef, useState} from 'react';

export const ChannelHeader = ({channelName}: {channelName: string}) => {
  const [showUserPopup, setShowUserPopup] = useState<boolean>(false);
  const userPopupRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showUserPopup &&
        userPopupRef.current &&
        userButtonRef.current &&
        !userPopupRef.current.contains(event.target as Node) &&
        !userButtonRef.current.contains(event.target as Node)
      ) {
        setShowUserPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserPopup]);
  return (
    <div className="bg-gray-100 p-4 border-b">
      <div className="flex flex-col items-start">
        <h2 className="font-semibold text-xl mb-2">#{channelName}</h2>
      </div>
    </div>
  );
};
