import type {TemplateProps} from '@/subapps/website/common/types';
import {type About25Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import {ServiceCard3} from '@/subapps/website/common/components/reuseable/service-cards';

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
  } = data || {};

  const image = getMetaFileURL({
    metaFile: about25Image,
    path: 'about25Image',
    ...props,
  });

  return (
    <section id="about">
      <div className="wrapper bg-gray">
        <div className="container py-14 py-md-16">
          <div className="row gx-md-8 gx-xl-12 gy-6 align-items-center">
            <div className="col-md-8 col-lg-6 order-lg-2 mx-auto">
              <div className="img-mask mask-2">
                <img
                  src={image}
                  alt=""
                  style={{width: '100%', height: 'auto'}}
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
      </div>
    </section>
  );
}
