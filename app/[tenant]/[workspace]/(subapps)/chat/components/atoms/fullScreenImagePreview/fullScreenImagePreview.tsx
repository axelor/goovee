/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import {Download, XIcon, ZoomInIcon, ZoomOutIcon} from 'lucide-react';
import {focusInputMessage} from '../../../utils/focusOnInput';

export const FullscreenImagePreview = ({
  isFullscreen,
  setIsFullscreen,
  isZoomed,
  toggleZoom,
  urlFilePreview,
  file,
  publicLink,
}: {
  isFullscreen: boolean;
  setIsFullscreen: (value: boolean) => void;
  isZoomed: boolean;
  toggleZoom: () => void;
  urlFilePreview: string | null;
  file: any;
  publicLink: string;
}) => {
  if (!isFullscreen) return null;

  console.log('public link ', publicLink);

  const handleDownload = async () => {
    try {
      const response = await fetch(publicLink);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name || 'image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur lors du téléchargement de l'image:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 overflow-auto">
      <div className={`relative ${isZoomed ? '' : 'max-w-4xl max-h-full'}`}>
        <img
          src={urlFilePreview || ''}
          alt={file.name}
          className={`${
            isZoomed ? 'w-auto h-auto' : 'max-w-full max-h-full object-contain'
          }`}
        />
      </div>
      <div className="fixed top-4 right-4 flex space-x-4">
        <button className="text-white hover:text-gray-300">
          <Download size={24} onClick={handleDownload} />
        </button>
        <button className="text-white hover:text-gray-300" onClick={toggleZoom}>
          {isZoomed ? <ZoomOutIcon size={24} /> : <ZoomInIcon size={24} />}
        </button>
        <button
          className="text-white hover:text-gray-300"
          onClick={() => {
            setIsFullscreen(false);
            focusInputMessage();
          }}>
          <XIcon size={24} />
        </button>
      </div>
    </div>
  );
};
