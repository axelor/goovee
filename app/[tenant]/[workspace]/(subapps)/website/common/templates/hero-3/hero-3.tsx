import type {TemplateProps} from '@/subapps/website/common/types';
import {type Hero3Data} from './meta';
import {getImage, getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {slideInDownAnimate} from '@/subapps/website/common/utils/animation';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import {Typewriter} from '@/subapps/website/common/components/reuseable/typewriter';
import Image from 'next/image';

export function Hero3(props: TemplateProps<Hero3Data>) {
  const {data} = props;
  const {
    hero3Title: title,
    hero3Description: description,
    hero3ButtonLabel: buttonLabel,
    hero3ButtonLink: buttonLink,
    hero3Image,
    hero3Video,
    hero3Typewriter: typewriter,
    hero3WrapperClassName: wrapperClassName,
    hero3ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: hero3Image,
    path: 'hero3Image',
    ...props,
  });

  const videoHref = getMetaFileURL({
    metaFile: hero3Video,
    path: 'hero3Video',
    ...props,
  });
  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-0 gy-10 align-items-center">
          <div className="col-lg-6">
            <h1
              className="display-1 text-white mb-4"
              style={slideInDownAnimate('600ms')}>
              {title} <br />
              <span className="text-primary text-nowrap">
                <Typewriter
                  options={{
                    loop: true,
                    autoStart: true,
                    strings: typewriter?.map(item => item.attrs.text) ?? [],
                  }}
                />
              </span>
            </h1>

            <p
              className="lead fs-24 lh-sm text-white mb-7 pe-md-18 pe-lg-0 pe-xxl-15"
              style={slideInDownAnimate('900ms')}>
              {description}
            </p>

            <div style={slideInDownAnimate('1200ms')}>
              <NextLink
                href={buttonLink}
                title={buttonLabel}
                className="btn btn-lg btn-primary rounded"
              />
            </div>
          </div>

          <div className="col-lg-5 offset-lg-1 mb-n18" data-cues="slideInDown">
            <div
              className="position-relative"
              style={slideInDownAnimate('0ms')}>
              <a
                data-glightbox
                data-type="video"
                href={videoHref}
                className="btn btn-circle btn-primary btn-play ripple mx-auto mb-6 position-absolute"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%,-50%)',
                  zIndex: 3,
                }}>
                <i className="icn-caret-right" />
              </a>

              <figure className="rounded shadow-lg">
                {image?.url && (
                  <Image
                    src={image.url}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                  />
                )}
              </figure>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
