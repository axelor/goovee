import type {TemplateProps} from '@/subapps/website/common/types';
import {type Banner5Data} from './meta';
import Plyr from '@/subapps/website/common/components/reuseable/Plyr';

export function Banner5(props: TemplateProps<Banner5Data>) {
  const {data} = props;
  const {
    banner5Heading: heading,
    banner5Video: video,
    banner5WrapperClassName: wrapperClassName,
    banner5ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row">
          <div className="col-xl-9 col-xxl-7 mx-auto text-center">
            <i className="icn-flower text-leaf fs-30 opacity-25"></i>
            <h2 className="display-5 text-center mt-2 mb-10">{heading}</h2>
          </div>
        </div>

        <div className="row text-center">
          <div className="col-xl-9 mx-auto">
            <Plyr
              options={{loadSprite: true, clickToPlay: true}}
              source={{
                type: 'video',
                sources: [{src: video, provider: 'vimeo'}],
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
