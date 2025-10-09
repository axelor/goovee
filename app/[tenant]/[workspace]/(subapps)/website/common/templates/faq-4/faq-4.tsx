import type {TemplateProps} from '@/subapps/website/common/types';
import Image from 'next/image';
import {type Faq4Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import Counter2 from '@/subapps/website/common/components/reuseable/counter/Counter2';

export function FAQ4(props: TemplateProps<Faq4Data>) {
  const {data} = props;
  const {
    faq4Image,
    faq4Facts: facts,
    faq4WrapperClassName: wrapperClassName,
    faq4ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: faq4Image,
    path: 'faq4Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row ">
          <div className="col-xl-10 mx-auto">
            <div className="card image-wrapper bg-full overflow-hidden position-relative">
              <Image
                src={image.url}
                alt={image.alt || 'FAQ background'}
                fill
                className="object-fit-cover"
              />
              <div
                className="position-absolute top-0 left-0 w-100 h-100 bg-dark opacity-40"
                style={{zIndex: 1}}></div>
              <div
                className="card-body p-9 p-xl-11 position-relative"
                style={{zIndex: 2}}>
                <div className="row align-items-center counter-wrapper gy-8 text-center text-white">
                  {facts?.map(({id, attrs: item}) => (
                    <Counter2
                      key={id}
                      amount={item.amount || 0}
                      title={item.title || ''}
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
