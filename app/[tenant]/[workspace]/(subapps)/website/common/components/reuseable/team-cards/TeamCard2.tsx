import {FC} from 'react';
import Image from 'next/image';
import SocialLinks from '../SocialLinks';

// ==========================================================
type TeamCard2Props = {
  name?: string;
  image?: string;
  designation?: string;
  description?: string;
  socialLinks?: {id: string; icon: string; url: string}[];
};
// ==========================================================

const TeamCard2: FC<TeamCard2Props> = props => {
  const {name, description, designation, image, socialLinks} = props;

  return (
    <div className="text-center">
      <div className="rounded-circle w-20 mx-auto mb-4 overflow-hidden">
        <Image
          width={500}
          height={500}
          alt="Team Member"
          src={image}
          style={{width: '100%', height: 'auto'}}
        />
      </div>

      <h4 className="mb-1">{name}</h4>
      <div className="meta mb-2">{designation}</div>
      <p className="mb-2">{description}</p>

      <SocialLinks
        links={socialLinks || []}
        className="nav social justify-content-center text-center mb-0"
      />
    </div>
  );
};

export default TeamCard2;
