import dayjs from 'dayjs';
import Link from 'next/link';
import {FC, Fragment} from 'react';
// -------- custom component -------- //
import FigureImage from './FigureImage';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import SocialLinks from '@/subapps/website/common/components/reuseable/SocialLinks';
// -------- data -------- //
import data from '@/subapps/website/common/data/blog-sidebar';

// ========================================================
type BlogSidebarProps = {thumbnail?: string};
// ========================================================

const BlogSidebar: FC<BlogSidebarProps> = ({thumbnail}) => {
  return (
    <Fragment>
      <div className="widget">
        <h4 className="widget-title mb-3">About Us</h4>
        {thumbnail && (
          <figure className="rounded mb-4">
            <img className="img-fluid" src={thumbnail} alt="" />
          </figure>
        )}

        <p>
          Terms and conditions, often referred to as T&C or terms of service,
          are legal agreements between a business or service provider and its
          users or customers.
        </p>

        <SocialLinks className="nav social" />
      </div>

      {/* ========== popular posts section ========== */}
      <div className="widget">
        <h4 className="widget-title mb-3">Popular Posts</h4>

        <ul className="image-list">
          {data.popularPosts.map(({id, title, image, comment, date}) => (
            <li key={id}>
              <NextLink
                title={
                  <FigureImage
                    width={100}
                    height={100}
                    className="rounded"
                    src={image}
                  />
                }
                href="#"
              />

              <div className="post-content">
                <h6 className="mb-2">
                  <NextLink className="link-dark" title={title} href="#" />
                </h6>

                <ul className="post-meta">
                  <li className="post-date">
                    <i className="uil uil-calendar-alt" />
                    <span>{dayjs(date).format('DD MMM YYYY')}</span>
                  </li>

                  <li className="post-comments">
                    <Link href="#" passHref>
                      <i className="uil uil-comment" /> {comment}
                    </Link>
                  </li>
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* ========== categories section ========== */}
      <div className="widget">
        <h4 className="widget-title mb-3">Categories</h4>

        <ul className="unordered-list bullet-primary text-reset">
          {data.categories.map(({id, title, post, url}) => (
            <li key={id}>
              <NextLink title={`${title} (${post})`} href={url} />
            </li>
          ))}
        </ul>
      </div>

      {/* ========== tags section ========== */}
      <div className="widget">
        <h4 className="widget-title mb-3">Tags</h4>

        <ul className="list-unstyled tag-list">
          {data.tags.map(({id, title, url}) => (
            <li key={id}>
              <NextLink
                title={title}
                href={url}
                className="btn btn-soft-ash btn-sm rounded-pill"
              />
            </li>
          ))}
        </ul>
      </div>

      {/* ========== archieve section ========== */}
      <div className="widget">
        <h4 className="widget-title mb-3">Archive</h4>

        <ul className="unordered-list bullet-primary text-reset">
          {data.archive.map(({id, title, url}) => (
            <li key={id}>
              <NextLink title={title} href={url} />
            </li>
          ))}
        </ul>
      </div>
    </Fragment>
  );
};

export default BlogSidebar;
