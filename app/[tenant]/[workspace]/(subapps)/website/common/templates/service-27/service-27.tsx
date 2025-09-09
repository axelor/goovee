import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service27Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Link from 'next/link';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function Service27(props: TemplateProps<Service27Data>) {
  const {data} = props;
  const {
    service27Title: title,
    service27Description: description,
    service27LinkTitle: linkTitle,
    service27LinkHref: linkHref,
    service27Services: services,
  } = data || {};

  const serviceList = services || [];
  const middleIndex = Math.ceil(serviceList.length / 2);
  const firstColServices = serviceList.slice(0, middleIndex);
  const secondColServices = serviceList.slice(middleIndex);

  return (
    <section id="services">
      <div className="wrapper bg-gray">
        <div className="container py-15 py-md-17">
          <div className="row gx-lg-0 gy-10 align-items-center">
            <div className="col-lg-6">
              <div className="row g-6 text-center">
                <div className="col-md-6">
                  {firstColServices.map((service, index) => (
                    <Card
                      key={index}
                      title={service?.attrs.title}
                      figCaption={service?.attrs.figcaption}
                      imageLink={service?.attrs.url}
                      image={getMetaFileURL({
                        metaFile: service?.attrs.image,
                        path: `service27Services[${index}].attrs.image`,
                        ...props,
                      })}
                      className={
                        index < firstColServices.length - 1 ? 'mb-6' : ''
                      }
                    />
                  ))}
                </div>
                <div className="col-md-6">
                  {secondColServices.map((service, index) => {
                    const classNames = [];
                    if (index === 0) {
                      classNames.push('mt-md-6');
                    }
                    if (index < secondColServices.length - 1) {
                      classNames.push('mb-6');
                    }
                    return (
                      <Card
                        key={index}
                        figCaption={service?.attrs.figcaption}
                        imageLink={service?.attrs.url}
                        title={service?.attrs.title}
                        image={getMetaFileURL({
                          metaFile: service?.attrs.image,
                          path: `service27Services[${middleIndex + index}].attrs.image`,
                          ...props,
                        })}
                        className={classNames.join(' ')}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="col-lg-5 offset-lg-1">
              <h2 className="display-5 mb-3">{title}</h2>
              <p className="lead fs-lg">{description}</p>

              <NextLink
                title={linkTitle}
                href={linkHref}
                className="btn btn-primary rounded-pill mt-2"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------------------------------
type CardProps = {
  image?: string;
  title?: string;
  className?: string;
  figCaption?: string;
  imageLink?: string;
};

const Card = ({
  image,
  title,
  className = '',
  figCaption,
  imageLink,
}: CardProps) => (
  <div className={`card shadow-lg ${className}`}>
    <figure className="card-img-top overlay overlay-1">
      <Link href={imageLink || '#'} passHref>
        <img className="img-fluid" src={image} alt="" />
        <span className="bg" />
      </Link>

      <figcaption>
        <h5 className="from-top mb-0">{figCaption}</h5>
      </figcaption>
    </figure>

    <div className="card-body p-4">
      <h3 className="h4 mb-0">{title}</h3>
    </div>
  </div>
);
