import type {TemplateProps} from '@/subapps/website/common/types';
import {type Portfolio4Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Link from 'next/link';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';

export function Portfolio4(props: TemplateProps<Portfolio4Data>) {
  const {data} = props;
  const {
    portfolio4Description: description,
    portfolio4Pagination: pagination,
    portfolio4FigCaption: figCaption,
    portfolio4PortfolioList: portfolioList = [],
    portfolio4WrapperClassName: wrapperClassName = 'bg-light',
    portfolio4ContainerClassName: containerClassName = 'py-14 py-md-16',
  } = data || {};

  return (
    <section className={`wrapper ${wrapperClassName}`} data-code={props.code}>
      <div className="overflow-hidden">
        <div className={`container ${containerClassName}`}>
          <div className="row">
            <div className="col-lg-9 col-xl-8 col-xxl-7 mx-auto text-center">
              <i className="icn-flower text-leaf fs-30 opacity-25"></i>
              <h2 className="display-5 text-center mt-2 mb-10">
                {description}
              </h2>
            </div>
          </div>

          <div className="swiper-container grid-view nav-bottom nav-color mb-14 text-center">
            <Carousel
              pagination={pagination}
              className="overflow-visible pb-2"
              breakpoints={{0: {slidesPerView: 1}, 768: {slidesPerView: 2}}}>
              {portfolioList?.map(({id, attrs: item}, i) => (
                <div className="card shadow-lg" key={id}>
                  <figure className="card-img-top overlay overlay-1">
                    <Link href={item.linkUrl || '#'}>
                      <img
                        className="img-fluid"
                        src={getMetaFileURL({
                          metaFile: item.image,
                          path: `portfolio4PortfolioList[${i}].attrs.image`,
                          ...props,
                        })}
                        alt=""
                      />
                      <span className="bg" />
                    </Link>

                    <figcaption>
                      <h5 className="from-top mb-0">{figCaption}</h5>
                    </figcaption>
                  </figure>

                  <div className="card-body p-6">
                    <h3 className="fs-21 mb-1">{item.name}</h3>
                    <ul className="post-meta fs-16 mb-0">
                      <li>{item.stat}</li>
                      <li>{item.category}</li>
                    </ul>
                  </div>
                </div>
              ))}
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
}
