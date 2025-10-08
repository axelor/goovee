import Image from 'next/image';
import {FC, Fragment} from 'react';
import {ImageType} from '@/subapps/website/common/types/templates';

// ======================================================
type Banner4Props = {
  thumbnail?: ImageType;
  media?: string;
  mediaType?: string;
  hideShape?: boolean;
  btnColor?: 'white' | 'primary';
};
// ======================================================

function getDataType(mediaType?: string) {
  if (mediaType?.startsWith('image/')) {
    return 'image';
  }
  if (mediaType?.startsWith('video/')) {
    return 'video';
  }
}

const Banner4: FC<Banner4Props> = ({
  hideShape,
  thumbnail,
  media,
  mediaType,
  btnColor = 'primary',
}) => {
  return (
    <Fragment>
      <a
        data-glightbox
        data-type={getDataType(mediaType)}
        href={media}
        className={`btn btn-circle btn-${btnColor} btn-play ripple mx-auto mb-5 position-absolute`}
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          zIndex: 3,
        }}>
        <i className="icn-caret-right" />
      </a>

      {!hideShape && (
        <div
          className="shape rounded bg-soft-primary rellax d-md-block"
          style={{
            width: '85%',
            height: '90%',
            right: '-1.5rem',
            bottom: '-1.8rem',
          }}
        />
      )}

      <figure className="rounded">
        {thumbnail?.url && (
          <Image
            src={thumbnail.url}
            alt={thumbnail.alt}
            width={thumbnail.width}
            height={thumbnail.height}
          />
        )}
      </figure>
    </Fragment>
  );
};

export default Banner4;
