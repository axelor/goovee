import {ServiceCard3} from '@/subapps/website/common/components/reuseable/service-cards';
import Design from '@/subapps/website/common/icons/solid/Design';
import type {TemplateProps} from '@/subapps/website/common/types';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import dynamic from 'next/dynamic';
import {type About20Data} from './meta';

function getIcon(icon: string) {
  return icon
    ? dynamic(() =>
        import(`@/subapps/website/common/icons/solid/${icon}`).catch(err => {
          return Design;
        }),
      )
    : Design;
}

export function About20(props: TemplateProps<About20Data>) {
  const {data} = props;
  const {
    about20Caption: caption,
    about20Description: description,
    about20Image1,
    about20Image2,
    about20Image3,
    about20AboutList: aboutList,
  } = data || {};

  const image1 = getMetaFileURL({
    metaFile: about20Image1,
    path: 'about20Image1',
    ...props,
  });

  const image2 = getMetaFileURL({
    metaFile: about20Image2,
    path: 'about20Image2',
    ...props,
  });

  const image3 = getMetaFileURL({
    metaFile: about20Image3,
    path: 'about20Image3',
    ...props,
  });

  return (
    <div className="container">
      <div className="row gy-10 gy-sm-13 gx-md-8 gx-xl-12 align-items-center mt-15">
        <div className="col-lg-6">
          <div className="row gx-md-5 gy-5">
            <div className="col-12">
              <figure className="rounded mx-md-5">
                <img src={image1} alt="" />
              </figure>
            </div>

            <div className="col-md-6">
              <figure className="rounded">
                <img src={image2} alt="" />
              </figure>
            </div>

            <div className="col-md-6">
              <figure className="rounded">
                <img src={image3} alt="" />
              </figure>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <h2 className="fs-16 text-uppercase text-muted mb-3">{caption}</h2>
          <h3 className="display-3 mb-8">{description}</h3>

          <div className="row gy-6">
            {aboutList?.map(({id, attrs: item}) => {
              const Icon = getIcon(item.icon ?? '');
              return (
                <div className="col-md-6" key={id}>
                  <ServiceCard3
                    title={item.title}
                    description={item.description}
                    Icon={
                      Icon ? (
                        <Icon className="icon-svg-xs solid text-fuchsia me-4" />
                      ) : null
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
