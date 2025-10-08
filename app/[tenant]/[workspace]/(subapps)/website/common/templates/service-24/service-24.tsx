import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service24Data} from './meta';
import {
  getImage,
  getPaddingBottom,
} from '@/subapps/website/common/utils/helper';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import Image from 'next/image';

export function Service24(props: TemplateProps<Service24Data>) {
  const {data} = props;
  const {
    service24Caption: caption,
    service24Title: title,
    service24Services: services,
    service24WrapperClassName: wrapperClassName,
    service24ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row text-center">
          <div className="col-md-10 offset-md-1 col-lg-8 offset-lg-2">
            <h2 className="fs-16 text-uppercase text-primary mb-3">
              {caption}
            </h2>
            <h3 className="display-3 mb-10 px-xxl-10">{title}</h3>
          </div>
        </div>

        <div className="row gx-lg-8 gx-xl-12 gy-11 px-xxl-5 text-center d-flex align-items-end">
          {services?.map(({id, attrs: item}, i) => (
            <div className="col-lg-4" key={id}>
              <div className="px-md-15 px-lg-3">
                {(() => {
                  const img = getImage({
                    image: item.image,
                    path: `service24Services[${i}].attrs.image`,
                    ...props,
                  });
                  return (
                    <figure
                      className="mb-6 position-relative"
                      style={{paddingBottom: getPaddingBottom(img)}}>
                      <Image
                        className="img-fluid object-fit-cover"
                        src={img.url}
                        alt={img.alt}
                        fill
                      />
                    </figure>
                  );
                })()}
                <h3>{item.title}</h3>
                <p className="mb-2">{item.description}</p>
                <NextLink
                  title={item.linkTitle}
                  href={item.linkHref}
                  className="more hover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
