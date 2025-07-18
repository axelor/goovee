import dayjs from 'dayjs';
import {FC} from 'react';
import Link from 'next/link';
// -------- custom components -------- //
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import carouselBreakpoints from '@/subapps/website/common/utils/carouselBreakpoints';
// -------- data -------- //
import {blogList3} from '@/subapps/website/common/data/blog';

const Blog5: FC = () => {
  return (
    <section className="wrapper bg-soft-primary">
      <div className="overflow-hidden">
        <div className="container py-14 py-md-16">
          <div className="row">
            <div className="col-xl-7 col-xxl-6 mx-auto text-center">
              <i className="icn-flower text-leaf fs-30 opacity-25"></i>
              <h2 className="display-5 text-center mt-2 mb-10">
                These are some of the popular articles from my site.
              </h2>
            </div>
          </div>

          <div className="swiper-container nav-bottom nav-color mb-14 swiper-container-3">
            <Carousel
              grabCursor
              pagination={false}
              className="overflow-visible pb-2"
              breakpoints={carouselBreakpoints}>
              {blogList3.map(item => (
                <article key={item.id}>
                  <div className="card shadow-lg">
                    <figure className="card-img-top overlay overlay-1">
                      <Link href="#">
                        <img
                          src={item.image['1x']}
                          srcSet={item.image['2x']}
                          alt=""
                        />
                        <span className="bg" />
                      </Link>

                      <figcaption>
                        <h5 className="from-top mb-0">Read More</h5>
                      </figcaption>
                    </figure>

                    <div className="card-body p-6">
                      <div className="post-header">
                        <div className="post-category">
                          <NextLink
                            title={item.category}
                            href="#"
                            className="hover"
                          />
                        </div>

                        <h2 className="post-title h3 mt-1 mb-3">
                          <NextLink
                            title={item.title}
                            href={item.link}
                            className="link-dark"
                          />
                        </h2>
                      </div>

                      <div className="post-footer">
                        <ul className="post-meta d-flex mb-0">
                          <li className="post-date">
                            <i className="uil uil-calendar-alt" />
                            <span>
                              {dayjs(item.createdAt).format('DD MMM YYYY')}
                            </span>
                          </li>

                          <li className="post-comments">
                            <Link href="#">
                              <i className="uil uil-comment" />
                              {item.comments}
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Blog5;
