import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service13Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {slideInDownAnimate} from '@/subapps/website/common/utils/animation';
import {ServiceCard2} from '@/subapps/website/common/components/reuseable/service-cards';

export function Service13(props: TemplateProps<Service13Data>) {
  const {data} = props;
  const {
    service13Title: title,
    service13Image,
    service13Services: services,
    service13WrapperClassName: wrapperClassName,
    service13ContainerClassName: containerClassName,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: service13Image,
    path: 'service13Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <figure
          className="rounded mt-md-n21 mt-lg-n23 mb-14"
          style={slideInDownAnimate('900ms')}>
          <img src={image} alt="" />
        </figure>

        <div className="row">
          <div className="col-md-10 col-lg-8 col-xl-7 col-xxl-6 mx-auto text-center">
            <h3 className="display-4 text-white mb-10 px-xl-10">{title}</h3>
          </div>
        </div>

        <div className="row gx-md-8 gy-8 text-center text-white">
          {services?.map(({id, attrs: item}) => (
            <ServiceCard2
              key={id}
              title={item.title}
              icon={`uil-${item.icon}`}
              description={item.description}
              linkUrl={item.linkUrl}
              linkTitle={item.linkTitle}
              titleColor="text-white"
              hiddenBtn
            />
          ))}
        </div>
      </div>
    </section>
  );
}
