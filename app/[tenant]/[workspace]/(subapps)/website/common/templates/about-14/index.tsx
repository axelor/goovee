import type {TemplateProps} from '@/subapps/website/common/types';
import {type About14Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import AccordionList from '@/subapps/website/common/components/common/AccordionList';
import Image from 'next/image';

export default function About14(props: TemplateProps<About14Data>) {
  const {data} = props;
  const {
    about14Title: title,
    about14Image,
    about14Accordions: accordionsList,
    about14WrapperClassName: wrapperClassName,
    about14ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: about14Image,
    path: 'about14Image',
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
            <h3 className="display-4 mb-7 mt-lg-10">{title}</h3>
            <AccordionList accordions={accordions} id="about14" />
          </div>
        </div>
      </div>
    </section>
  );
}
