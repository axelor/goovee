import type {TemplateProps} from '@/subapps/website/common/types';
import {type Facts8Data} from './meta';
import {CountUp} from '@/subapps/website/common/components/reuseable/countup';

export function Facts8(props: TemplateProps<Facts8Data>) {
  const {data} = props;
  const {
    facts8Title: title,
    facts8Description: description,
    facts8Facts: facts,
  } = data || {};

  return (
    <section className="wrapper bg-soft-primary">
      <div className="container py-14 pt-md-15 pb-md-20">
        <div className="row align-items-center gx-lg-8 gx-xl-12 gy-10 gy-lg-0">
          <div className="col-lg-4 text-center text-lg-start">
            <h3 className="display-4 mb-3">{title}</h3>
            <p className="lead fs-lg mb-0">{description}</p>
          </div>

          <div className="offset-lg-1 col-lg-7 mt-lg-2">
            <div className="row align-items-center counter-wrapper gy-6 text-center">
              {facts?.map(({id, attrs: item}) => (
                <div className="col-md-4" key={id}>
                  <h3 className="counter">
                    <CountUp end={item.number || 0} suffix={item.suffix} />
                  </h3>
                  <p>{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
