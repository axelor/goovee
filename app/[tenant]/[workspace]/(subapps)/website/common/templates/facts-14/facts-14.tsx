import type {TemplateProps} from '@/subapps/website/common/types';
import {type Facts14Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import {CountUp} from '@/subapps/website/common/components/reuseable/countup';
import {Fragment} from 'react';
import Image from 'next/image';

export function Facts14(props: TemplateProps<Facts14Data>) {
  const {data} = props;
  const {
    facts14Title: title,
    facts14Caption: caption,
    facts14Image,
    facts14Facts: facts,
    facts14WrapperClassName: wrapperClassName,
    facts14ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: facts14Image,
    path: 'facts14Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <Fragment>
          <div className="row text-center mb-7">
            <div className="col-lg-11 col-xl-10 col-xxl-9 mx-auto">
              <h2 className="fs-16 text-uppercase text-muted mb-3">
                {caption}
              </h2>
              <h3 className="display-3 px-lg-12 px-xxl-14">{title}</h3>
            </div>
          </div>

          <div className="row mb-6">
            <div className="col-md-10 col-lg-9 col-xl-7 mx-auto">
              <div className="row align-items-center counter-wrapper gy-4 gy-md-0">
                {facts?.map(({id, attrs: item}) => (
                  <div className="col-md-4 text-center" key={id}>
                    <h3 className="counter counter-lg text-primary">
                      <CountUp
                        end={item.amount || 0}
                        suffix={item.suffix}
                        separator=""
                      />
                    </h3>
                    <p>{item.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <figure>
            <Image
              src={image.url}
              alt={image.alt}
              width={image.width}
              height={image.height}
            />
          </figure>
        </Fragment>
      </div>
    </section>
  );
}
