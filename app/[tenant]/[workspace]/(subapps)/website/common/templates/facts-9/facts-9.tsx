import type {TemplateProps} from '@/subapps/website/common/types';
import {type Facts9Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import animation from '@/subapps/website/common/utils/animation';
import {Counter2} from '@/subapps/website/common/components/reuseable/counter';

export function Facts9(props: TemplateProps<Facts9Data>) {
  const {data} = props;
  const {facts9BackgroundImage, facts9Image, facts9Facts: facts} = data || {};

  const backgroundImage = getMetaFileURL({
    metaFile: facts9BackgroundImage,
    path: 'facts9BackgroundImage',
    ...props,
  });

  const image = getMetaFileURL({
    metaFile: facts9Image,
    path: 'facts9Image',
    ...props,
  });

  return (
    <div className="container">
      <div
        className="row"
        style={animation({name: 'slideInUp', delay: '100ms'})}>
        <div className="col-12 mt-n20">
          <figure className="rounded">
            <img src={image} alt="" />
          </figure>

          <div className="col-xl-10 mx-auto">
            <div
              style={{backgroundImage: `url(${backgroundImage})`}}
              className="card image-wrapper bg-full bg-image bg-overlay bg-overlay-300 text-white mt-n5 mt-lg-0 mt-lg-n50p mb-lg-n50p border-radius-lg-top">
              <div className="card-body p-9 p-xl-10">
                <div className="row align-items-center counter-wrapper gy-4 text-center">
                  {facts?.map(({id, attrs: item}) => (
                    <Counter2
                      key={id}
                      title={item.title || ''}
                      amount={item.amount || 0}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
