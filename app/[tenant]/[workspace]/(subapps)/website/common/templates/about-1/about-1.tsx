import AccordionList from '@/subapps/website/common/components/common/AccordionList';
import type {TemplateProps} from '@/subapps/website/common/types';
import {type About1Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';

export function About1(props: TemplateProps<About1Data>) {
  const {data} = props;
  const {
    about1Title: title,
    about1Caption: caption,
    about1Image,
    about1Accordions: accordionsList,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: about1Image,
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
    <section className="wrapper bg-light angled upper-start lower-start">
      <div className="container pb-14 pb-md-15">
        <div className="row gx-lg-8 gx-xl-12 gy-10 mb-lg-22 mb-xl-24 align-items-center">
          <div className="col-lg-7">
            <figure>
              <img alt="choose us" className="w-auto" src={image} />
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
