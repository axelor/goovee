import type {TemplateProps} from '@/subapps/website/common/types';
import {type Facts3Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import {Counter2} from '@/subapps/website/common/components/reuseable/counter';

export function Facts3(props: TemplateProps<Facts3Data>) {
  const {data} = props;
  const {
    facts3BackgroundImage,
    facts3Facts: facts,
    facts3WrapperClassName: wrapperClassName,
    facts3ContainerClassName: containerClassName,
  } = data || {};

  const backgroundImage = getImage({
    image: facts3BackgroundImage,
    path: 'facts3BackgroundImage',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row">
          <div className="col-xl-10 mx-auto">
            <div
              style={{backgroundImage: `url(${backgroundImage.url})`}}
              className="card image-wrapper bg-full bg-image bg-overlay bg-overlay-400 text-white border-radius-lg-top">
              <div className="card-body p-9 p-xl-10">
                <div className="row align-items-center counter-wrapper gy-4 text-center">
                  {facts?.map(item => (
                    <Counter2
                      key={item.id}
                      amount={item.attrs.amount || 0}
                      title={item.attrs.title || ''}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
