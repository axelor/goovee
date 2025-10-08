import type {TemplateProps} from '@/subapps/website/common/types';
import {type Hero18Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import {
  fadeInAnimate,
  slideInDownAnimate,
} from '@/subapps/website/common/utils/animation';
import Image from 'next/image';

export function Hero18(props: TemplateProps<Hero18Data>) {
  const {data} = props;
  const {
    hero18Title1: title1,
    hero18Title2: title2,
    hero18Description: description,
    hero18ButtonLabel: buttonLabel,
    hero18ButtonLink: buttonLink,
    hero18Image,
    hero18BackgroundImage,
    hero18SectionClassName: sectionClassName,
    hero18ContainerCardClassName: containerCardClassName,
    hero18CardClassName: cardClassName,
    hero18CardBodyClassName: cardBodyClassName,
    hero18ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: hero18Image,
    path: 'hero18Image',
    ...props,
  });

  const backgroundImage = getImage({
    image: hero18BackgroundImage,
    path: 'hero18BackgroundImage',
    ...props,
  });

  return (
    <section className={sectionClassName} data-code={props.code}>
      <div className={containerCardClassName}>
        <div className={cardClassName}>
          <Image
            src={backgroundImage.url}
            alt={backgroundImage.alt || 'Hero background'}
            fill
            className="object-fit-cover"
          />
          <div
            className="position-absolute top-0 left-0 w-100 h-100 bg-white opacity-50"
            style={{zIndex: 1}}></div>
          <div className={cardBodyClassName} style={{zIndex: 2}}>
            <div className={containerClassName}>
              <div className="row gx-md-8 gx-xl-12 gy-10 align-items-center text-center text-lg-start">
                <div className="col-lg-6">
                  <h1
                    className="display-2 mb-4 me-xl-5 me-xxl-0"
                    style={slideInDownAnimate('900ms')}>
                    {title1}{' '}
                    <span className="text-gradient gradient-1">{title2}</span>
                  </h1>

                  <p
                    className="lead fs-23 lh-sm mb-7 pe-xxl-15"
                    style={slideInDownAnimate('1200ms')}>
                    {description}
                  </p>

                  <div style={slideInDownAnimate('1500ms')}>
                    <NextLink
                      title={buttonLabel}
                      href={buttonLink}
                      className="btn btn-lg btn-gradient gradient-1 rounded"
                    />
                  </div>
                </div>

                <div className="col-lg-6">
                  <Image
                    alt={image.alt}
                    className="img-fluid mb-n10"
                    src={image.url}
                    width={image.width}
                    height={image.height}
                    style={fadeInAnimate('300ms')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
