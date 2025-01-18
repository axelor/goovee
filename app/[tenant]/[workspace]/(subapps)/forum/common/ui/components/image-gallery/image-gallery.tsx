'use client';

import {useState} from 'react';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {getImageURL} from '@/utils/files';
import {formatNumber} from '@/locale/formatters';

// ---- LOCAL IMPORTS ---- //
import {MAX_IMAGES_BEFORE_OVERLAY} from '@/subapps/forum/common/constants';
import type {Post} from '@/subapps/forum/common/types/forum';
import {ThreadPopup} from '@/subapps/forum/common/ui/components';

export const ImageGallery = ({images, post}: {images: any; post?: Post}) => {
  const showOverlay = images.length > MAX_IMAGES_BEFORE_OVERLAY;

  const [openPopUp, setOpenPopUp] = useState(false);

  const {tenant} = useWorkspace();

  const openThreadPopup = () => {
    post && setOpenPopUp(true);
  };

  const closeThreadPopup = () => {
    setOpenPopUp(false);
  };

  return (
    <>
      <div
        className={`grid grid-cols-${images.length >= 3 ? '3' : images.length} gap-6`}
        onClick={openThreadPopup}>
        {images.slice(0, 3).map((image: any, index: number) => (
          <div key={image.id} className="relative">
            <div
              className="w-full h-[12.813rem] bg-no-repeat bg-center bg-cover cursor-pointer"
              style={{
                backgroundImage: `url(${getImageURL(image?.metaFile?.id, tenant)})`,
              }}></div>
            {index === 2 && showOverlay && (
              <div className="absolute inset-0 flex items-center cursor-pointer justify-center bg-black bg-opacity-50 text-white text-5xl font-semibold">
                +{formatNumber(images.length - 3)}
              </div>
            )}
          </div>
        ))}
      </div>
      <ThreadPopup
        post={post}
        images={images}
        open={openPopUp}
        onClose={closeThreadPopup}
      />
    </>
  );
};

export default ImageGallery;
