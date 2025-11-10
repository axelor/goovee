import type {TemplateProps} from '@/subapps/website/common/types';
import {type Process4Data} from './meta';
import dynamic from 'next/dynamic';
import animation from '@/subapps/website/common/utils/animation';
import {getMetaFileURL} from '../../utils/helper';
import Plyr from '@/subapps/website/common/components/reuseable/Plyr';

function getIcon(icon: string) {
  return dynamic(() => import(`@/subapps/website/common/icons/solid/${icon}`));
}

export default function Process4(props: TemplateProps<Process4Data>) {
  const {data} = props;
  const {
    process4Video,
    process4Caption: caption,
    process4Description: description,
    process4Processes: processes,
    process4WrapperClassName: wrapperClassName,
    process4ContainerClassName: containerClassName,
  } = data || {};

  const videoSrc = getMetaFileURL({
    metaFile: process4Video,
    path: 'process4Video',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div
          className="row text-center"
          style={animation({name: 'slideInUp', delay: '0ms'})}>
          <div className="col-lg-10 mx-auto">
            <div className="mt-lg-n20 mt-xl-n22 position-relative">
              <div
                className="shape bg-dot red rellax w-16 h-18"
                style={{zIndex: 0, top: '1rem', left: '-3.9rem'}}
              />
              <div
                className="shape rounded-circle bg-line primary rellax w-18 h-18"
                style={{zIndex: 0, bottom: '2rem', right: '-3rem'}}
              />

              <Plyr
                options={{loadSprite: true, clickToPlay: true}}
                source={{type: 'video', sources: [{src: videoSrc}]}}
              />
            </div>
          </div>
        </div>

        <div className="row text-center mt-12">
          <div className="col-lg-9 mx-auto">
            <h2 className="fs-15 text-uppercase text-muted mb-3">{caption}</h2>
            <h3 className="display-4 mb-0 text-center px-xl-10 px-xxl-15">
              {description}
            </h3>

            <div className="row gx-lg-8 gx-xl-12 process-wrapper text-center mt-9">
              {processes?.map(({id, attrs: item}) => {
                const Icon = item.icon && getIcon(item.icon);
                return (
                  <div key={id} className="col-md-4">
                    {Icon && <Icon />}
                    <h4 className="mb-1">{item.title}</h4>
                    <p>{item.subtitle}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
