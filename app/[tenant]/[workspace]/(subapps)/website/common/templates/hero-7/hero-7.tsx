import type {TemplateProps} from '@/subapps/website/common/types';
import {type Hero7Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {
  fadeInAnimate,
  slideInDownAnimate,
  zoomInAnimate,
} from '@/subapps/website/common/utils/animation';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function Hero7(props: TemplateProps<Hero7Data>) {
  const {data} = props;
  const {
    hero7Title: title,
    hero7Description: description,
    hero7ButtonLabel1: buttonLabel1,
    hero7ButtonLabel2: buttonLabel2,
    hero7ButtonLink1: buttonLink1,
    hero7ButtonLink2: buttonLink2,
    hero7Image,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: hero7Image,
    path: 'hero7Image',
    ...props,
  });

  return (
    <section className="wrapper bg-gradient-primary">
      <div className="container py-14 pt-md-15 pb-md-18">
        <div className="row text-center">
          <div className="col-lg-9 col-xxl-8 mx-auto">
            <h2 className="display-1 mb-4" style={zoomInAnimate('0ms')}>
              {title}
            </h2>

            <p
              className="lead fs-24 lh-sm px-md-5 px-xl-15 px-xxl-10 mb-7"
              style={zoomInAnimate('500ms')}>
              {description}
            </p>
          </div>
        </div>

        <div className="d-flex justify-content-center">
          <span style={slideInDownAnimate('900ms')}>
            <NextLink
              href={buttonLink1}
              title={buttonLabel1}
              className="btn btn-lg btn-primary rounded-pill mx-1"
            />
          </span>

          <span style={slideInDownAnimate('1200ms')}>
            <NextLink
              href={buttonLink2}
              title={buttonLabel2}
              className="btn btn-lg btn-outline-primary rounded-pill mx-1"
            />
          </span>
        </div>

        <div className="row mt-12" style={fadeInAnimate('1600ms')}>
          <div className="col-lg-8 mx-auto">
            <figure>
              <img alt="" className="img-fluid" src={image} />
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
