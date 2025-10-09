import type {TemplateProps} from '@/subapps/website/common/types';
import {type Faq4Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {Counter2} from '@/subapps/website/common/components/reuseable/counter';

export function FAQ4(props: TemplateProps<Faq4Data>) {
  const {data} = props;
  const {
    faq4Image,
    faq4Facts: facts,
    faq4WrapperClassName: wrapperClassName,
    faq4ContainerClassName: containerClassName,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: faq4Image,
    path: 'faq4Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row ">
          <div className="col-xl-10 mx-auto">
            <div
              className="card image-wrapper bg-full bg-image bg-overlay bg-overlay-400"
              style={{backgroundImage: `url(${image})`}}>
              <div className="card-body p-9 p-xl-11">
                <div className="row align-items-center counter-wrapper gy-8 text-center text-white">
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
