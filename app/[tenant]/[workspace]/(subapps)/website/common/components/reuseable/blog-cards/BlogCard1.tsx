import {FC} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import NextLink from '../links/NextLink';

// ======================================================
type BlogCard1Props = {
  date?: string;
  image?: string;
  title?: string;
  category?: string;
};
// ======================================================

const BlogCard1: FC<BlogCard1Props> = ({date, image, title, category}) => {
  return (
    <article>
      <figure className="overlay overlay-1 hover-scale rounded mb-6">
        <Link href="#" passHref>
          <Image
            width={560}
            height={350}
            src={image}
            alt={title}
            style={{width: '100%', height: 'auto'}}
          />
          <span className="bg" />
        </Link>

        <figcaption>
          <h5 className="from-top mb-0">Read More</h5>
        </figcaption>
      </figure>

      <div className="post-header">
        <p className="post-title fs-22 mb-3">
          <NextLink title={title} className="link-dark" href="#" />
        </p>
      </div>

      <div className="post-footer">
        <ul className="post-meta">
          <li className="post-date">
            <i className="uil uil-calendar-alt" />
            <span>{date}</span>
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
    </article>
  );
};

export default BlogCard1;
