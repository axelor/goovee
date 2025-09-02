import type {TemplateProps} from '@/subapps/website/common/types';
import {type Facts4Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {CountUp} from '@/subapps/website/common/components/reuseable/countup';

export function Facts4(props: TemplateProps<Facts4Data>) {
  const {data} = props;
  const {
    facts4Title: title,
    facts4Caption: caption,
    facts4BackgroundImage,
    facts4Facts: facts,
  } = data || {};

  const backgroundImage = getMetaFileURL({
    metaFile: facts4BackgroundImage,
    path: 'facts4BackgroundImage',
    ...props,
  });

  return (
    <section
      className="wrapper image-wrapper bg-auto no-overlay bg-image text-center bg-map"
      style={{backgroundImage: `url(${backgroundImage})`}}>
      <div className="container pt-0 pb-14 pt-md-16 pb-md-18">
        <div className="row">
          <div className="col-md-8 col-xl-7 col-xxl-6 mx-auto">
            <h2 className="fs-15 text-uppercase text-muted mb-3">{caption}</h2>
            <h3 className="display-4 mb-8 px-lg-12">{title}</h3>
          </div>
        </div>

        <div className="row">
          <div className="col-md-10 col-lg-9 col-xl-7 mx-auto">
            <div className="row align-items-center counter-wrapper gy-4 gy-md-0">
              {facts?.map(({id, attrs: item}) => (
                <div className="col-md-4 text-center" key={id}>
                  <h3 className="counter counter-lg text-primary">
                    <CountUp
                      end={item.value || 0}
                      separator=""
                      suffix={item.suffix}
                    />
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
