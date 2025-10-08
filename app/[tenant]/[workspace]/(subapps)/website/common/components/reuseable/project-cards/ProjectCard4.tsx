import {FC} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {ImageType} from '../../../types/templates';

// ==============================================================
type Props = {
  id: number;
  image: ImageType;
  title: string;
  color: string;
  category: string;
};
// ==============================================================

const ProjectCard4: FC<Props> = ({image, title, color, category}) => {
  return (
    <div className="card shadow-lg">
      <figure className="card-img-top" title="Click to see the project">
        <Link href="#">
          {image?.url && (
            <Image
              width={image.width}
              height={image.height}
              src={image.url}
              alt={image.alt}
            />
          )}
        </Link>
      </figure>

      <div className="card-body p-7">
        <div className="post-header">
          <div className={`post-category text-line mb-2 text-${color}`}>
            {category}
          </div>
          <h3 className="mb-0">{title}</h3>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard4;
