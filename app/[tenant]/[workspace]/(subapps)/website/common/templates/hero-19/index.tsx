import type {TemplateProps} from '@/subapps/website/common/types';
import {type Hero19Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import {slideInDownAnimate} from '@/subapps/website/common/utils/animation';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export default function Hero19(props: TemplateProps<Hero19Data>) {
  const {data} = props;
  const {
    hero19Title1: title1,
    hero19Title2: title2,
    hero19Description: description,
    hero19ButtonLabel: buttonLabel,
    hero19ButtonLink: buttonLink,
    hero19BackgroundImage,
    hero19WrapperClassName: wrapperClassName,
    hero19ContainerClassName: containerClassName,
  } = data || {};

  const backgroundImage = getImage({
    image: hero19BackgroundImage,
    path: 'hero19BackgroundImage',
    ...props,
  });

  return (
    <section
      className={wrapperClassName}
      data-code={props.code}
      style={{backgroundImage: `url(${backgroundImage.url})`}}>
      <div className={containerClassName}>
        <div className="row">
          <div className="col-lg-8 col-xl-7 mx-auto">
            <h1
              className="display-1 text-white fs-60 mb-4 px-md-15 px-lg-0"
              style={slideInDownAnimate('0ms')}>
              {title1}{' '}
              <span className="underline-3 style-2 yellow">{title2}</span>
            </h1>

            <p
              className="lead fs-24 text-white lh-sm mb-7 mx-md-13 mx-lg-10"
              style={slideInDownAnimate('300ms')}>
              {description}
            </p>

            <div style={slideInDownAnimate('600ms')}>
              <NextLink
                title={buttonLabel}
                href={buttonLink}
                className="btn btn-white rounded mb-10 mb-xxl-5"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="divider text-light mx-n2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 60">
            <path fill="currentColor" d="M0,0V60H1440V0A5771,5771,0,0,1,0,0Z" />
          </svg>
        </div>
      </div>
    </section>
  );
}
