import {FC} from 'react';
import Image from 'next/image';
import NextLink from '../links/NextLink';
import {ImageType} from '../../../types/templates';

// ==============================================================================
type ProjectCard3Props = {
  link?: string;
  title?: string;
  image?: ImageType;
  category?: string;
  fullImage?: ImageType;
};
// ==============================================================================

const ProjectCard3: FC<ProjectCard3Props> = ({
  link,
  title,
  image,
  category,
  fullImage,
}) => {
  return (
    <>
      <figure className="rounded mb-6">
        {image?.url && (
          <Image
            width={image.width}
            height={image.height}
            src={image.url}
            alt={image.alt}
            style={{width: '100%', height: 'auto'}}
          />
        )}
        <a
          className="item-link"
          href={fullImage?.url}
          data-type="image"
          data-glightbox
          data-gallery="projects-group">
          <i className="uil uil-focus-add" />
        </a>
      </figure>

      <div className="project-details d-flex justify-content-center flex-column">
        <div className="post-header">
          <h2 className="post-title h3">
            <NextLink href={link} title={title} className="link-dark" />
          </h2>

          <div className="post-category text-ash">{category}</div>
        </div>
      </div>
    </>
  );
};

export default ProjectCard3;
