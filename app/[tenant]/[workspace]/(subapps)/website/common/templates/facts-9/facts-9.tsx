import type {TemplateProps} from '@/subapps/website/common/types';
import {type Facts9Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import animation from '@/subapps/website/common/utils/animation';
import {Counter2} from '@/subapps/website/common/components/reuseable/counter';
import Image from 'next/image';

export function Facts9(props: TemplateProps<Facts9Data>) {
  const {data} = props;
  const {
    facts9BackgroundImage,
    facts9Image,
    facts9Facts: facts,
    facts9WrapperClassName: wrapperClassName,
    facts9ContainerClassName: containerClassName,
    facts9RowClassName: rowClassName,
    facts9ColumnClassName: columnClassName,
  } = data || {};

  const backgroundImage = getImage({
    image: facts9BackgroundImage,
    path: 'facts9BackgroundImage',
    ...props,
  });

  const image = getImage({
    image: facts9Image,
    path: 'facts9Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div
          className={rowClassName}
          style={animation({name: 'slideInUp', delay: '100ms'})}>
          <div className={columnClassName}>
            <figure className="rounded">
              <Image
                src={image.url}
                alt={image.alt}
                width={image.width}
                height={image.height}
              />
            </figure>

            <div className="col-xl-10 mx-auto">
              <div
                style={{backgroundImage: `url(${backgroundImage.url})`}}
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
    </section>
  );
}
