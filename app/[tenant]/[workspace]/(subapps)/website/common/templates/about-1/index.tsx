import AccordionList from '@/subapps/website/common/components/common/AccordionList';
import type {TemplateProps} from '@/subapps/website/common/types';
import {type About1Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import Image from 'next/image';

export default function About1(props: TemplateProps<About1Data>) {
  const {data} = props;
  const {
    about1Title: title,
    about1Caption: caption,
    about1Image,
    about1Accordions: accordionsList,
    about1WrapperClassName: wrapperClassName,
    about1ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: about1Image,
    path: 'about1Image',
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
        <div className="row gx-lg-8 gx-xl-12 gy-10 mb-lg-22 mb-xl-24 align-items-center">
          <div className="col-lg-7">
            <figure>
              <Image
                alt={image.alt}
                className="w-auto"
                src={image.url}
                width={image.width}
                height={image.height}
              />
            </figure>
          </div>

          <div className="col-lg-5">
            <h2 className="fs-16 text-uppercase text-muted mb-3">{caption}</h2>
            <h3 className="display-4 mb-7">{title}</h3>

            <AccordionList accordions={accordions} id="about1" />
          </div>
        </div>
      </div>
    </section>
  );
}
