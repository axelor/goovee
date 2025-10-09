import type {TemplateProps} from '@/subapps/website/common/types';
import {type About23Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import AccordionList from '@/subapps/website/common/components/common/AccordionList';
import Image from 'next/image';

export function About23(props: TemplateProps<About23Data>) {
  const {data} = props;
  const {
    about23Title: title,
    about23Caption: caption,
    about23Image,
    about23Accordions: accordionsList,
    about23WrapperClassName: wrapperClassName,
    about23ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: about23Image,
    path: 'about23Image',
    ...props,
  });

  const accordions =
    accordionsList?.map(({id, attrs: item}) => ({
      id,
      expand: item.expand,
      heading: item.heading,
      body: item.body,
    })) ?? [];

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10">
          <div className="col-lg-7 order-lg-2">
            <figure>
              <Image
                className="w-auto"
                src={image.url}
                alt={image.alt}
                width={image.width}
                height={image.height}
              />
            </figure>
          </div>

          <div className="col-lg-5">
            <h3 className="fs-16 text-uppercase text-muted mt-xxl-8 mb-3">
              {caption}
            </h3>
            <h3 className="display-4 mb-6">{title}</h3>
            <AccordionList accordions={accordions} id="about23" />
          </div>
        </div>
      </div>
    </section>
  );
}
