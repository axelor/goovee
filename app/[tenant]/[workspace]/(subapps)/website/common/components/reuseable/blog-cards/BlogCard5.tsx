import dayjs from 'dayjs';
import {FC} from 'react';
import Link from 'next/link';
import NextLink from '../links/NextLink';
import Image from 'next/image';
import {ImageType} from '@/subapps/website/common/types/templates';
import {getPaddingBottom} from '@/subapps/website/common/utils/helper';

// ======================================================
type BlogCard5Props = {
  image?: ImageType;
  title?: string;
  author?: string;
  category?: string;
  comments?: string;
  createdAt?: string;
  imageLink?: string;
  authorLink?: string;
  commentsLink?: string;
  titleLink?: string;
};
// ======================================================

const BlogCard5: FC<BlogCard5Props> = props => {
  const {
    image,
    title,
    titleLink,
    author,
    category,
    createdAt,
    comments,
    commentsLink,
    imageLink,
    authorLink,
  } = props;

  return (
    <figure className="overlay caption caption-overlay rounded mb-0">
      <Link
        href={imageLink || '#'}
        className="position-relative"
        style={{paddingBottom: getPaddingBottom(image)}}>
        {image?.url && (
          <Image
            src={image.url}
            fill
            alt={image.alt}
            className="object-fit-cover"
          />
        )}
        <span className="bg" />
      </Link>

      <figcaption>
        <span className="badge badge-lg bg-white text-uppercase mb-3">
          {category}
        </span>
        <h2 className="post-title h3 mt-1 mb-3">
          <NextLink title={title} href={titleLink || '#'} />
        </h2>

        <ul className="post-meta text-white mb-0">
          <li className="post-date">
            <i className="uil uil-calendar-alt" />
            <span>{dayjs(createdAt).format('DD MMM YYYY')}</span>
          </li>

          <li className="post-author">
            <Link href={authorLink || '#'}>
              <i className="uil uil-user" />
              <span>{author}</span>
            </Link>
          </li>

          <li className="post-comments">
            <Link href={commentsLink || '#'}>
              <i className="uil uil-comment" />
              {comments}
            </Link>
          </li>
        </ul>
      </figcaption>
    </figure>
  );
};

export default BlogCard5;
