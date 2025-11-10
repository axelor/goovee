import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service10Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import ServiceCard5 from '@/subapps/website/common/components/reuseable/service-cards/ServiceCard5';
import Image from 'next/image';

export default function Service10(props: TemplateProps<Service10Data>) {
  const {data} = props;
  const {
    service10Title: title,
    service10Description: description,
    service10Caption: caption,
    service10LinkTitle: linkTitle,
    service10LinkHref: linkHref,
    service10Image1,
    service10Image2,
    service10CardTitle1,
    service10CardTitle2,
    service10CardIcon1,
    service10CardIcon2,
    service10CardDescription1,
    service10CardDescription2,
    service10CardUrl1,
    service10CardUrl2,
    service10CardButtonText1,
    service10CardButtonText2,
    service10WrapperClassName: wrapperClassName,
    service10ContainerClassName: containerClassName,
  } = data || {};

  const image1 = getImage({
    image: service10Image1,
    path: 'service10Image1',
    ...props,
  });

  const image2 = getImage({
    image: service10Image2,
    path: 'service10Image2',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-0 gy-10 align-items-center">
          <div className="col-lg-6">
            <div className="row g-6 text-center">
              <div className="col-md-6">
                <div className="row">
                  <div className="col-lg-12">
                    <figure className="rounded mb-6">
                      <Image
                        src={image2.url}
                        alt={image2.alt}
                        width={image2.width}
                        height={image2.height}
                      />
                    </figure>
                  </div>

                  <div className="col-lg-12">
                    <ServiceCard5
                      url={service10CardUrl1}
                      title={service10CardTitle1}
                      icon={service10CardIcon1}
                      className="card shadow-lg mb-md-6 mt-lg-6"
                      description={service10CardDescription1}
                      buttonText={service10CardButtonText1}
                    />
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="row">
                  <div className="col-lg-12 order-md-2">
                    <figure className="rounded mb-6 mb-md-0">
                      <Image
                        src={image1.url}
                        alt={image1.alt}
                        width={image1.width}
                        height={image1.height}
                      />
                    </figure>
                  </div>

                  <div className="col-lg-12">
                    <ServiceCard5
                      url={service10CardUrl2}
                      icon={service10CardIcon2}
                      title={service10CardTitle2}
                      description={service10CardDescription2}
                      buttonText={service10CardButtonText2}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-5 offset-lg-1">
            <h2 className="display-4 mb-3">{title}</h2>

            <p className="lead fs-lg lh-sm">{caption}</p>

            <p>{description}</p>

            <NextLink
              href={linkHref}
              title={linkTitle}
              className="btn btn-primary rounded-pill mt-3"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
