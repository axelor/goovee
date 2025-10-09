import type {TemplateProps} from '@/subapps/website/common/types';
import {type About25Data} from './meta';
import {
  getImage,
  getPaddingBottom,
} from '@/subapps/website/common/utils/helper';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import {ServiceCard3} from '@/subapps/website/common/components/reuseable/service-cards';
import Image from 'next/image';

export function About25(props: TemplateProps<About25Data>) {
  const {data} = props;
  const {
    about25Caption: caption,
    about25Para1: para1,
    about25Para2: para2,
    about25Image,
    about25LinkTitle: linkTitle,
    about25LinkHref: linkHref,
    about25Heading: heading,
    about25Description: description,
    about25AboutList: aboutList,
    about25WrapperClassName: wrapperClassName,
    about25ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: about25Image,
    path: 'about25Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-md-8 gx-xl-12 gy-6 align-items-center">
          <div className="col-md-8 col-lg-6 order-lg-2 mx-auto">
            <div
              className="img-mask mask-2 position-relative"
              style={{paddingBottom: getPaddingBottom(image)}}>
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className="object-fit-cover"
              />
            </div>
          </div>

          <div className="col-lg-6">
            <h2 className="display-5 mb-3">{caption}</h2>
            <p className="lead fs-lg">{para1}</p>
            <p>{para2}</p>
            <p>{description}</p>

            <NextLink
              title={linkTitle}
              href={linkHref}
              className="btn btn-primary rounded-pill mt-2"
            />
          </div>
        </div>

        <div className="row gx-md-8 gx-xl-12 mt-10 mt-md-13">
          <div className="col-lg-4">
            <h2 className="display-5 mb-3">{heading}</h2>
            <p>{description}</p>
          </div>

          <div className="col-lg-8">
            <div className="row gy-6 gx-md-8 gx-xl-12">
              {aboutList?.map(({id, attrs: item}, i) => (
                <div className="col-md-6" key={id}>
                  <ServiceCard3
                    title={item.title}
                    description={item.description}
                    Icon={
                      <span className="icon btn btn-circle btn-primary pe-none me-4">
                        <span className="number fs-18">{i + 1}</span>
                      </span>
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
