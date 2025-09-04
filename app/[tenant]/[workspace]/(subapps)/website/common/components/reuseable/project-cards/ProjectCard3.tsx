import {FC} from 'react';
import Image from 'next/image';
import NextLink from '../links/NextLink';

// ==============================================================================
type ProjectCard3Props = {
  link?: string;
  title?: string;
  image?: string;
  category?: string;
  fullImage?: string;
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
        <Image
          width={410}
          height={440}
          src={image}
          alt={title}
          style={{width: '100%', height: 'auto'}}
        />
        <a
          className="item-link"
          href={fullImage}
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
