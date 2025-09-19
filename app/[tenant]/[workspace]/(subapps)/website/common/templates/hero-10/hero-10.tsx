import type {TemplateProps} from '@/subapps/website/common/types';
import {type Hero10Data} from './meta';
import {slideInDownAnimate} from '@/subapps/website/common/utils/animation';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function Hero10(props: TemplateProps<Hero10Data>) {
  const {data} = props;
  const {
    hero10Title: title,
    hero10Description: description,
    hero10ButtonLabel: buttonLabel,
    hero10ButtonLink: buttonLink,
  } = data || {};

  return (
    <section className="wrapper bg-light">
      <div className="container pt-11 pt-md-13 pb-11 pb-md-19 pb-lg-22 text-center">
        <div className="row">
          <div className="col-lg-8 col-xl-7 col-xxl-6 mx-auto">
            <h1
              className="display-1 fs-60 mb-4 px-md-15 px-lg-0"
              style={slideInDownAnimate('0ms')}>
              {title}
            </h1>

            <p
              className="lead fs-24 lh-sm mb-7 mx-md-13 mx-lg-10"
              style={slideInDownAnimate('300ms')}>
              {description}
            </p>

            <div style={slideInDownAnimate('600ms')}>
              <NextLink
                title={buttonLabel}
                href={buttonLink}
                className="btn btn-lg btn-primary rounded mb-5"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
