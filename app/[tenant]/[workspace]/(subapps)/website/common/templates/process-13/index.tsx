import type {TemplateProps} from '@/subapps/website/common/types';
import {type Process13Data} from './meta';
import dynamic from 'next/dynamic';
import Hex from '@/subapps/website/common/icons/Hex';
import {getMetaFileURL} from '../../utils/helper';
import Plyr from '@/subapps/website/common/components/reuseable/Plyr';

const getIcon = (icon: string) => {
  return dynamic(() => import(`@/subapps/website/common/icons/solid/${icon}`));
};

export default function Process13(props: TemplateProps<Process13Data>) {
  const {data} = props;
  const {
    process13Caption: caption,
    process13Heading: heading,
    process13Video,
    process13Processes: processes,
    process13WrapperClassName: wrapperClassName,
    process13ContainerClassName: containerClassName,
  } = data || {};

  const videoSrc = getMetaFileURL({
    metaFile: process13Video,
    path: 'process13Video',
    ...props,
  });
  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row text-center">
          <div className="col-lg-10 mx-auto position-relative">
            <div className="position-relative">
              <div
                className="shape pale-pink rellax w-18 h-18"
                style={{top: '1rem', left: '-4.2rem'}}>
                <Hex />
              </div>

              <div
                className="shape pale-primary rellax w-18 h-18"
                style={{bottom: '2rem', right: '-3.5rem'}}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 500 500"
                  className="svg-inject icon-svg w-100 h-100">
                  <g data-name="Layer 2">
                    <path
                      className="svg-fill"
                      d="M250 0C111.93 0 0 111.93 0 250s111.93 250 250 250 250-111.93 250-250S388.07 0 250 0zm0 425a175 175 0 11175-175 175 175 0 01-175 175z"
                      data-name="Layer 1"
                    />
                  </g>
                </svg>
              </div>

              <Plyr
                options={{loadSprite: true, clickToPlay: true}}
                source={{type: 'video', sources: [{src: videoSrc}]}}
              />
            </div>
          </div>
        </div>

        <div className="row text-center mt-12">
          <div className="col-lg-10 mx-auto">
            <h2 className="fs-16 text-uppercase text-muted mb-3">{caption}</h2>
            <h3 className="display-3 text-center px-lg-17 px-xl-20 px-xxl-22 mb-10">
              {heading}
            </h3>

            <div className="row gx-lg-8 gx-xl-12 process-wrapper arrow text-center">
              {processes?.map(({id, attrs: item}) => {
                const Icon = item.icon && getIcon(item.icon);
                return (
                  <div className="col-md-4" key={id}>
                    {Icon && (
                      <Icon className="icon-svg-sm solid text-purple mb-4" />
                    )}
                    <h3 className="fs-22">{item.title}</h3>
                    <p>{item.description}</p>
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
