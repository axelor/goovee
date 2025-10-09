import type {TemplateProps} from '@/subapps/website/common/types';
import {type Hero21Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import Image from 'next/image';

export function Hero21(props: TemplateProps<Hero21Data>) {
  const {data} = props;
  const {
    hero21Title: title,
    hero21RotatingTitle: rotatingTitle,
    hero21Description: description,
    hero21ButtonLabel: buttonLabel,
    hero21ButtonLink: buttonLink,
    hero21Image,
    hero21ListTitle: listTitle,
    hero21Clients: clients,
    hero21WrapperClassName: wrapperClassName,
    hero21ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: hero21Image,
    path: 'hero21Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 gy-xl-0 mb-14 align-items-center">
          <div className="col-lg-7 order-lg-2">
            <figure>
              <Image
                alt={image.alt}
                className="img-auto"
                src={image.url}
                width={image.width}
                height={image.height}
              />
            </figure>
          </div>

          <div className="col-md-10 offset-md-1 offset-lg-0 col-lg-5 text-center text-lg-start">
            <h1 className="display-1 fs-54 mb-5 mx-md-n5 mx-lg-0 mt-7">
              {title} <br className="d-md-none" />
              <span className="rotator-fade text-primary">{rotatingTitle}</span>
            </h1>

            <p className="lead fs-lg mb-7">{description}</p>

            <span>
              <NextLink
                title={buttonLabel}
                href={buttonLink}
                className="btn btn-lg btn-primary rounded-pill me-2"
              />
            </span>
          </div>
        </div>

        <p className="text-center mb-8 text-uppercase">{listTitle}</p>
        <div className="row row-cols-4 row-cols-md-4 row-cols-lg-7 row-cols-xl-7 gy-10 mb-2 d-flex align-items-center justify-content-center">
          {clients?.map(({id, attrs: item}, i) => (
            <div className="col" key={id}>
              {(() => {
                const img = getImage({
                  image: item.image,
                  path: `hero21Clients[${i}].attrs.image`,
                  ...props,
                });
                return (
                  <Image
                    className="img-fluid px-md-3 px-lg-0 px-xl-2 px-xxl-5"
                    src={img.url}
                    alt={img.alt || 'client'}
                    width={img.width}
                    height={img.height}
                  />
                );
              })()}
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="divider text-soft-primary mx-n2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100">
            <path
              fill="currentColor"
              d="M1260,1.65c-60-5.07-119.82,2.47-179.83,10.13s-120,11.48-180,9.57-120-7.66-180-6.42c-60,1.63-120,11.21-180,16a1129.52,1129.52,0,0,1-180,0c-60-4.78-120-14.36-180-19.14S60,7,30,7H0v93H1440V30.89C1380.07,23.2,1319.93,6.15,1260,1.65Z"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
