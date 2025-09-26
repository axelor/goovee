import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service6Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import ListColumn from '@/subapps/website/common/components/reuseable/ListColumn';
import {fadeInAnimate} from '../../utils/animation';

export function Service6(props: TemplateProps<Service6Data>) {
  const {data} = props;
  const {
    service6Title: title,
    service6Description: description,
    service6Image1,
    service6Image2,
    service6Image3,
    service6ServiceList: serviceList,
    service6WrapperClassName: wrapperClassName,
    service6ContainerClassName: containerClassName,
  } = data || {};

  const image1 = getMetaFileURL({
    metaFile: service6Image1,
    path: 'service6Image1',
    ...props,
  });

  const image2 = getMetaFileURL({
    metaFile: service6Image2,
    path: 'service6Image2',
    ...props,
  });

  const image3 = getMetaFileURL({
    metaFile: service6Image3,
    path: 'service6Image3',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 align-items-center">
          <div className="col-lg-6 position-relative">
            <div className="row gx-md-5 gy-5 position-relative align-items-center">
              <div className="col-6">
                <img
                  alt=""
                  src={image1}
                  className="img-fluid rounded shadow-lg d-flex ms-auto"
                  style={fadeInAnimate('300ms')}
                />
              </div>

              <div className="col-6">
                <img
                  alt=""
                  src={image2}
                  className="img-fluid rounded shadow-lg mb-5"
                  style={fadeInAnimate('900ms')}
                />
                <img
                  alt=""
                  src={image3}
                  className="img-fluid rounded shadow-lg d-flex col-10"
                  style={fadeInAnimate('1200ms')}
                />
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <h3 className="display-4 mb-5">{title}</h3>
            <p className="mb-5">{description}</p>

            <ListColumn
              list={serviceList?.attrs.list ?? []}
              rowClass={serviceList?.attrs.rowClass}
              bulletColor={serviceList?.attrs.bulletColor}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
