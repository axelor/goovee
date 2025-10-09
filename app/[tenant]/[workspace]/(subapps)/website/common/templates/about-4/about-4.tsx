import type {TemplateProps} from '@/subapps/website/common/types';
import {type About4Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import AccordionList from '@/subapps/website/common/components/common/AccordionList';
import Image from 'next/image';

export function About4(props: TemplateProps<About4Data>) {
  const {data} = props;
  const {
    about4Title: title,
    about4TileImage1,
    about4TileImage2,
    about4TileImage3,
    about4TileImage4,
    about4Accordions: accordionsList,
    about4WrapperClassName: wrapperClassName,
    about4ContainerClassName: containerClassName,
  } = data || {};

  const tileImage1 = getImage({
    image: about4TileImage1,
    path: 'about4TileImage1',
    ...props,
  });

  const tileImage2 = getImage({
    image: about4TileImage2,
    path: 'about4TileImage2',
    ...props,
  });

  const tileImage3 = getImage({
    image: about4TileImage3,
    path: 'about4TileImage3',
    ...props,
  });

  const tileImage4 = getImage({
    image: about4TileImage4,
    path: 'about4TileImage4',
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
        <div className="row gy-10 gy-sm-13 gx-lg-8 align-items-center">
          <div className="col-lg-7 order-lg-2">
            <div className="row gx-md-5 gy-5">
              <div className="col-md-4 offset-md-2 align-self-end">
                <figure className="rounded">
                  <Image
                    src={tileImage1.url}
                    alt={tileImage1.alt}
                    width={tileImage1.width}
                    height={tileImage1.height}
                  />
                </figure>
              </div>

              <div className="col-md-6 align-self-end">
                <figure className="rounded">
                  <Image
                    src={tileImage2.url}
                    alt={tileImage2.alt}
                    width={tileImage2.width}
                    height={tileImage2.height}
                  />
                </figure>
              </div>

              <div className="col-md-6 offset-md-1">
                <figure className="rounded">
                  <Image
                    src={tileImage3.url}
                    alt={tileImage3.alt}
                    width={tileImage3.width}
                    height={tileImage3.height}
                  />
                </figure>
              </div>

              <div className="col-md-4 align-self-start">
                <figure className="rounded">
                  <Image
                    src={tileImage4.url}
                    alt={tileImage4.alt}
                    width={tileImage4.width}
                    height={tileImage4.height}
                  />
                </figure>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <h3 className="display-4 mb-7">{title}</h3>
            <div className="accordion accordion-wrapper">
              <AccordionList id="about4" accordions={accordions} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
