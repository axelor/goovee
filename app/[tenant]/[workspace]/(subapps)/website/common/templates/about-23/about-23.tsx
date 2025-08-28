import type {TemplateProps} from '@/subapps/website/common/types';
import {type About23Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import AccordionList from '@/subapps/website/common/components/common/AccordionList';

export function About23(props: TemplateProps<About23Data>) {
  const {data} = props;
  const {
    about23Title: title,
    about23Caption: caption,
    about23Image,
    about23Accordions: accordionsList,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: about23Image,
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
    <div className="container">
      <div className="row gx-lg-8 gx-xl-12 gy-10">
        <div className="col-lg-7 order-lg-2">
          <figure>
            <img alt="choose-us" className="w-auto" src={image} />
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
  );
}
