import {FC} from 'react';
import Image from 'next/image';
import {ImageType} from '@/subapps/website/common/types/templates';
import {getPaddingBottom} from '@/subapps/website/common/utils/helper';

// ==========================================================
type TeamCard3Props = {
  name?: string;
  designation?: string;
  image?: ImageType;
};
// ==========================================================
const TeamCard3: FC<TeamCard3Props> = ({name, image, designation}) => {
  return (
    <div className="position-relative">
      <div
        className="shape rounded bg-soft-primary rellax d-md-block"
        style={{
          zIndex: 0,
          width: '98%',
          height: '98%',
          right: '-0.75rem',
          bottom: '-0.75rem',
        }}
      />

      <div className="card shadow-lg">
        {image?.url && (
          <figure
            className="card-img-top position-relative"
            style={{
              paddingBottom: getPaddingBottom(image),
            }}>
            <Image
              className="img-fluid object-fit-cover"
              src={image.url}
              alt={image.alt}
              fill
            />
          </figure>
        )}

        <div className="card-body px-6 py-5">
          <h4 className="mb-1">{name}</h4>
          <p className="mb-0">{designation}</p>
        </div>
      </div>
    </div>
  );
};

export default TeamCard3;
