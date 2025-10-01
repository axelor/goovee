import type {TemplateProps} from '@/subapps/website/common/types';
import {type Facts17Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {CountUp} from '@/subapps/website/common/components/reuseable/countup';

export function Facts17(props: TemplateProps<Facts17Data>) {
  const {data} = props;
  const {
    facts17Title: title,
    facts17Caption: caption,
    facts17Description: description,
    facts17Image,
    facts17Facts: facts,
    facts17WrapperClassName: wrapperClassName = 'bg-gray min-vh-60 ',
    facts17ContainerClassName: containerClassName = '',
  } = data || {};

  const image = getMetaFileURL({
    metaFile: facts17Image,
    path: 'facts17Image',
    ...props,
  });

  return (
    <section
      className={`wrapper position-relative d-lg-flex align-items-center ${wrapperClassName}`}
      data-code={props.code}>
      <div
        className="col-lg-6 position-lg-absolute top-0 end-0 image-wrapper bg-image bg-cover h-100"
        style={{backgroundImage: `url(${image})`}}>
        <div className="divider text-gray divider-v-start d-none d-lg-block">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 1200">
            <g />
            <g>
              <g>
                <polygon
                  fill="currentColor"
                  points="6 0 0 0 0 1200 6 1200 54 0 6 0"
                />
              </g>
            </g>
          </svg>
        </div>
      </div>

      <div className={`container ${containerClassName}`}>
        <div className="row gx-0">
          <div className="col-lg-6">
            <div className="pt-13 pb-15 pb-md-17 py-lg-16 pe-lg-15">
              <h2 className="fs-16 text-uppercase text-muted mb-3">
                {caption}
              </h2>
              <h3 className="display-3 ls-sm mb-5">{title}</h3>
              <p className="mb-6">{description}</p>
              <div className="row align-items-center counter-wrapper gy-6">
                {facts?.map(({id, attrs: item}) => (
                  <div className="col-md-6" key={id}>
                    <h3 className="counter counter-lg mb-1">
                      <CountUp end={item.countUp || 0} suffix={item.suffix} />
                    </h3>
                    <h6 className="fs-17 mb-1">{item.title}</h6>
                    <span className="ratings five" />
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
