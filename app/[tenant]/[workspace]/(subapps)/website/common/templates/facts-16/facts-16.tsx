import type {TemplateProps} from '@/subapps/website/common/types';
import {type Facts16Data} from './meta';

export function Facts16(props: TemplateProps<Facts16Data>) {
  const {data} = props;
  const {
    facts16Title: title,
    facts16Caption: caption,
    facts16Facts: facts,
    facts16SectionClassName: sectionClassName,
    facts16WrapperClassName: wrapperClassName,
    facts16ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={sectionClassName} data-code={props.code}>
      <div className={wrapperClassName}>
        <div className={containerClassName}>
          <div className="row text-center">
            <div className="col-xl-11 col-xxl-10 mx-auto">
              <h2 className="fs-16 text-uppercase text-muted mb-3">
                {caption}
              </h2>
              <h3 className="display-4 mb-10 px-lg-20 px-xl-21">{title}</h3>
              <div className="row gy-6 text-center">
                {facts?.map(({id, attrs: item}) => (
                  <div className="col-md-6 col-lg-3" key={id}>
                    <div
                      className={`progressbar semi-circle ${item.color}`}
                      data-value={item.value}
                    />
                    <h4>{item.title}</h4>
                    <p className="mb-0">{item.description}</p>
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
