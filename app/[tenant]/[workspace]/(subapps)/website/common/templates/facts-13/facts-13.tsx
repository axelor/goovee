import type {TemplateProps} from '@/subapps/website/common/types';
import {type Facts13Data} from './meta';

export function Facts13(props: TemplateProps<Facts13Data>) {
  const {data} = props;
  const {
    facts13Title: title,
    facts13Caption: caption,
    facts13Heading1: heading1,
    facts13Heading2: heading2,
    facts13DataValue1: dataValue1,
    facts13DataValue2: dataValue2,
    facts13WrapperClassName: wrapperClassName,
    facts13ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row align-items-center gy-8">
          <div className="col-lg-7 text-center text-lg-start">
            <h2 className="fs-16 text-uppercase text-muted mb-3">{caption}</h2>
            <h3 className="display-3 mb-0 pe-xl-10 pe-xxl-15">{title}</h3>
          </div>

          <div className="col-lg-5">
            <div className="row gy-6 text-center">
              <div className="col-md-6">
                <div
                  className="progressbar semi-circle fuchsia"
                  data-value={dataValue1}
                />
                <h4 className="mb-0">{heading1}</h4>
              </div>

              <div className="col-md-6">
                <div
                  className="progressbar semi-circle orange"
                  data-value={dataValue2}
                />
                <h4 className="mb-0">{heading2}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
