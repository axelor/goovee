import {FC} from 'react';
import Image from 'next/image';
import SocialLinks from '../SocialLinks';
import {ImageType} from '../../../types/templates';

// ==========================================================
type TeamCard1Props = {
  name?: string;
  image?: ImageType;
  shadow?: boolean;
  designation?: string;
  description?: string;
  socialLinks?: {id: string; icon: string; url: string}[];
};
// ==========================================================

const TeamCard1: FC<TeamCard1Props> = props => {
  const {
    name,
    description,
    designation,
    image,
    socialLinks,
    shadow = false,
  } = props;

  return (
    <div className={`card ${shadow ? 'shadow-lg' : ''}`}>
      <div className="card-body">
        <div className="rounded-circle w-15 mb-4 overflow-hidden">
          {image?.url && (
            <Image
              width={image.width}
              height={image.height}
              src={image.url}
              alt={image.alt}
              style={{width: '100%', height: 'auto'}}
            />
          )}
        </div>

        <h4 className="mb-1">{name}</h4>
        <div className="meta mb-2">{designation}</div>
        <p className="mb-2">{description}</p>

        <SocialLinks links={socialLinks || []} className="nav social mb-0" />
      </div>
    </div>
  );
};

export default TeamCard1;
