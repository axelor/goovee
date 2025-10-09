import dayjs from 'dayjs';
import {FC} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import NextLink from '../links/NextLink';
import {ImageType} from '@/subapps/website/common/types/templates';

// ======================================================
type BlogCard4Props = {
  date?: string;
  image?: ImageType;
  title?: string;
  category?: string;
  className?: string;
  description?: string;
};
// ======================================================

const BlogCard4: FC<BlogCard4Props> = props => {
  const {date, image, title, category, description, className = 'card'} = props;

  return (
    <article>
      <div className={className}>
        <figure className="card-img-top overlay overlay-1 hover-scale">
          <Link href="#">
            {image?.url && (
              <Image
                height={image.height}
                width={image.width}
                src={image.url}
                alt={image.alt}
                style={{width: '100%', height: 'auto'}}
              />
            )}
            <span className="bg" />
          </Link>

          <figcaption>
            <h5 className="from-top mb-0">Read More</h5>
          </figcaption>
        </figure>

        <div className="card-body">
          <div className="post-header">
            <h2 className="post-title h3 mt-1 mb-3">
              <NextLink title={title} className="link-dark" href="#" />
            </h2>
          </div>

          <div className="post-content">
            <p>{description}</p>
          </div>
        </div>

        <div className="card-footer">
          <ul className="post-meta d-flex mb-0">
            <li className="post-date">
              <i className="uil uil-calendar-alt" />
              <span>{dayjs(date).format('DD MMM YYYY')}</span>
            </li>

            <li className="post-comments">
              <NextLink
                href="#"
                className="link-dark"
                title={
                  <>
                    <i className="uil uil-file-alt fs-15" />
                    {category}
                  </>
                }
              />
            </li>
          </ul>
        </div>
      </div>
    </article>
  );
};

export default BlogCard4;
