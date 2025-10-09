import Image from 'next/image';
import {FC} from 'react';
import {ImageType} from '@/subapps/website/common/types/templates';

// ==================================================
type FigureImageProps = {
  image?: ImageType;
  className?: string;
};
// ==================================================

const FigureImage: FC<FigureImageProps> = ({image, className = ''}) => {
  return (
    <figure className={className}>
      {image?.url && (
        <Image
          src={image.url}
          alt={image.alt}
          width={image.width}
          height={image.height}
          style={{width: '100%', height: 'auto'}}
        />
      )}
    </figure>
  );
};

export default FigureImage;
