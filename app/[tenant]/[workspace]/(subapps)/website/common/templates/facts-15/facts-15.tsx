import type {TemplateProps} from '@/subapps/website/common/types';
import {type Facts15Data} from './meta';
import {Counter3} from '@/subapps/website/common/components/reuseable/counter';
import IconBox from '@/subapps/website/common/components/reuseable/IconBox';

export function Facts15(props: TemplateProps<Facts15Data>) {
  const {data} = props;
  const {
    facts15Title: title,
    facts15Caption: caption,
    facts15Description: description,
    facts15Facts: facts,
    facts15WrapperClassName: wrapperClassName,
    facts15ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 gy-lg-0 ">
          <div className="col-lg-4 text-center text-lg-start">
            <h2 className="fs-16 text-uppercase text-primary mb-3">
              {caption}
            </h2>
            <h3 className="display-3 mb-4 pe-xxl-5">{title}</h3>
            <p className="mb-0 pe-xxl-11">{description}</p>
          </div>

          <div className="col-lg-8 mt-lg-2">
            <div className="row align-items-center counter-wrapper gy-6 text-center">
              {facts?.map(({id, attrs: item}) => (
                <Counter3
                  title={title || ''}
                  number={item.number || 0}
                  suffix={item.suffix}
                  key={id}
                  Icon={
                    <IconBox
                      className="icon btn btn-circle btn-lg btn-soft-primary pe-none mb-4"
                      icon={`uil-${item.icon}`}
                    />
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
