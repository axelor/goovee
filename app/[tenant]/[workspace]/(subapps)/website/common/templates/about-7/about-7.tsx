import AccordionList from '@/subapps/website/common/components/common/AccordionList';
import type {TemplateProps} from '@/subapps/website/common/types';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {type About7Data} from './meta';

export function About7(props: TemplateProps<About7Data>) {
  const {data} = props;
  const {
    about7Title: title,
    about7LeadParagraph: leadParagraph,
    about7Image,
    about7Accordions: accordionsList,
    about7WrapperClassName: wrapperClassName,
    about7ContainerClassName: containerClassName,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: about7Image,
    path: 'about7Image',
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
        <div className="row gx-lg-8 gx-xl-12 gy-10 mb-15 mb-md-18 align-items-center">
          <div className="col-lg-7 order-lg-2">
            <figure>
              <img className="w-auto" src={image} alt="" />
            </figure>
          </div>

          <div className="col-lg-5">
            <h3 className="display-4 mt-xxl-8 mb-3">{title}</h3>
            <p className="lead fs-lg lh-sm mb-6">{leadParagraph}</p>

            <div className="accordion accordion-wrapper">
              <AccordionList id="about7" accordions={accordions} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
