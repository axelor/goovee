import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service26Data} from './meta';
import {
  getImage,
  getPaddingBottom,
} from '@/subapps/website/common/utils/helper';
import Link from 'next/link';
import Image from 'next/image';

export default function Service26(props: TemplateProps<Service26Data>) {
  const {data} = props;
  const {
    service26Description: description,
    service26Services: services,
    service26WrapperClassName: wrapperClassName,
    service26ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row">
          <div className="col-lg-12 col-xl-10 col-xxl-7 mx-auto text-center">
            <i className="icn-flower text-leaf fs-30 opacity-25" />
            <h2 className="display-5 text-center mt-2 mb-10">{description}</h2>
          </div>
        </div>

        <div className="row grid-view gx-md-8 gx-xl-10 gy-8 gy-lg-0 text-center">
          {services?.map(({id, attrs: item}, i) => (
            <div className="col-sm-8 col-md-6 col-lg-4 mx-auto" key={id}>
              <div className="card shadow-lg">
                <figure className="card-img-top overlay overlay-1">
                  {(() => {
                    const img = getImage({
                      image: item.image,
                      path: `service26Services[${i}].attrs.image`,
                      ...props,
                    });
                    return (
                      <Link
                        href={item.url || '#'}
                        className="position-relative"
                        style={{paddingBottom: getPaddingBottom(img)}}>
                        <Image
                          className="img-fluid object-fit-cover"
                          src={img.url}
                          alt={img.alt}
                          fill
                        />
                        <span className="bg" />
                      </Link>
                    );
                  })()}

                  <figcaption>
                    <h5 className="from-top mb-0">{item.figcaption}</h5>
                  </figcaption>
                </figure>

                <div className="card-body p-6">
                  <h3 className="fs-21 mb-0">{item.title}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
