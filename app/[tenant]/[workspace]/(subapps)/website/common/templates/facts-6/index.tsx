import type {TemplateProps} from '@/subapps/website/common/types';
import {type Facts6Data} from './meta';
import {CountUp} from '@/subapps/website/common/components/reuseable/countup';

export default function Facts6(props: TemplateProps<Facts6Data>) {
  const {data} = props;
  const {
    facts6Title: title,
    facts6Caption: caption,
    facts6Description: description,
    facts6Facts: facts,
    facts6WrapperClassName: wrapperClassName,
    facts6ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-0 gy-10 align-items-center">
          <div className="col-lg-6 order-lg-2 offset-lg-1">
            <div className="row gx-md-5 gy-5 align-items-center counter-wrapper">
              {facts?.map(({id, attrs: item}) => (
                <div className="col-md-6" key={id}>
                  <div className="card shadow-lg">
                    <div className="card-body">
                      <div className="d-flex d-lg-block d-xl-flex flex-row">
                        <div>
                          <div
                            className={`icon btn btn-circle btn-lg btn-${item.color} pe-none mx-auto me-4 mb-lg-3 mb-xl-0`}>
                            <i className={`uil uil-${item.icon}`} />
                          </div>
                        </div>

                        <div>
                          <h3 className="counter mb-1">
                            <CountUp end={item.amount || 0} />
                          </h3>
                          <p className="mb-0">{item.title}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-lg-5">
            <h2 className="display-4 mb-3">{title}</h2>
            <p className="lead fs-lg lh-sm">{caption}</p>
            <p className="mb-0">{description}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
