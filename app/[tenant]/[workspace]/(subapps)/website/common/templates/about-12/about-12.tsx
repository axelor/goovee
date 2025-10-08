import type {TemplateProps} from '@/subapps/website/common/types';
import {type About12Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import AccordionList from '@/subapps/website/common/components/common/AccordionList';
import Image from 'next/image';

export function About12(props: TemplateProps<About12Data>) {
  const {data} = props;
  const {
    about12Title: title,
    about12Caption: caption,
    about12Image,
    about12Accordions: accordionsList,
    about12WrapperClassName: wrapperClassName,
    about12ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: about12Image,
    path: 'about12Image',
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
        <div className="row gx-lg-8 gx-xl-12 gy-10 align-items-center">
          <div className="col-lg-7">
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
            <h2 className="fs-15 text-uppercase text-primary mb-3">
              {caption}
            </h2>
            <h3 className="display-4 mb-7">{title}</h3>
            <AccordionList accordions={accordions} id="about12" />
          </div>
        </div>
      </div>
    </section>
  );
}
