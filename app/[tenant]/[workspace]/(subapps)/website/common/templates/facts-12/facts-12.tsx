import type {TemplateProps} from '@/subapps/website/common/types';
import Image from 'next/image';
import {type Facts12Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import {CountUp} from '@/subapps/website/common/components/reuseable/countup';

export function Facts12(props: TemplateProps<Facts12Data>) {
  const {data} = props;
  const {
    facts12Title: title,
    facts12Caption: caption,
    facts12Image,
    facts12Facts: facts,
    facts12SectionClassName: sectionClassName,
    facts12ContainerCardClassName: containerCardClassName,
    facts12CardClassName: cardClassName,
    facts12CardBodyClassName: cardBodyClassName,
    facts12ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: facts12Image,
    path: 'facts12Image',
    ...props,
  });

  return (
    <section className={sectionClassName} data-code={props.code}>
      <div className={containerCardClassName}>
        <div className={cardClassName}>
          <Image
            src={image.url}
            alt={image.alt || 'Facts background'}
            fill
            className="object-cover"
          />
          <div className="absolute top-0 left-0 w-full h-full bg-white/50"></div>
          <div className={cardBodyClassName}>
            <div className={containerClassName}>
              <div className="row align-items-center gx-lg-8 gx-xl-12 gy-10 gy-lg-0">
                <div className="col-lg-4 text-center text-lg-start">
                  <h3 className="display-4 mb-3">{title}</h3>
                  <p className="lead fs-lg mb-0">{caption}</p>
                </div>

                <div className="col-lg-8 mt-lg-2">
                  <div className="row align-items-center counter-wrapper gy-6 text-center">
                    {facts?.map(({id, attrs: item}) => (
                      <div className="col-md-4" key={id}>
                        <h3 className="counter">
                          <CountUp
                            end={item.countUp || 0}
                            suffix={item.suffix}
                          />
                        </h3>
                        <p className="mb-0">{item.title}</p>
                      </div>
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
