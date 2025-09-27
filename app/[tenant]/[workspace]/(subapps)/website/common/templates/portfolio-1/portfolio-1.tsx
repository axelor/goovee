import type {TemplateProps} from '@/subapps/website/common/types';
import {type Portfolio1Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Image from 'next/image';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';

export function Portfolio1(props: TemplateProps<Portfolio1Data>) {
  const {data} = props;
  const {
    portfolio1Caption: caption,
    portfolio1Description: description,
    portfolio1Images: images = [],
  } = data || {};

  const carouselBreakpoints = {
    0: {slidesPerView: 1},
    768: {slidesPerView: 2},
    992: {slidesPerView: 3},
  };

  return (
    <>
      <div className="row container pt-8 pt-md-14 mx-auto">
        <div className="col-lg-9 col-xl-8 mx-auto text-center">
          <h2 className="fs-15 text-uppercase text-muted mb-3">{caption}</h2>
          <h3 className="display-4 mb-10">{description}</h3>
        </div>
      </div>
      <div className="container-fluid px-md-6">
        <div className="swiper-container blog grid-view mb-17 mb-md-19">
          <Carousel grabCursor breakpoints={carouselBreakpoints}>
            {images?.map(({id, attrs: item}, i) => (
              <figure className="rounded" key={id}>
                <Image
                  width={380}
                  height={320}
                  src={getMetaFileURL({
                    metaFile: item.image,
                    path: `portfolio1Images[${i}].attrs.image`,
                    ...props,
                  })}
                  alt="project"
                  style={{width: '100%', height: 'auto'}}
                />
              </figure>
            ))}
          </Carousel>
        </div>
      </div>
    </>
  );
}
