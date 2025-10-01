import type {TemplateProps} from '@/subapps/website/common/types';
import {type About16Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import AccordionList from '@/subapps/website/common/components/common/AccordionList';

export function About16(props: TemplateProps<About16Data>) {
  const {data} = props;
  const {
    about16Title: title,
    about16Caption: caption,
    about16Image,
    about16Accordions: accordionsList,
    about16WrapperClassName: wrapperClassName = '',
    about16ContainerClassName: containerClassName = '',
  } = data || {};

  const image = getMetaFileURL({
    metaFile: about16Image,
    path: 'about16Image',
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
    <section className={`wrapper ${wrapperClassName}`} data-code={props.code}>
      <div className={`container ${containerClassName}`}>
        <div className="row gy-10 gx-lg-8 gx-xl-12 mb-14 mb-md-16 align-items-center">
          <div className="col-md-8 col-lg-6">
            <figure className="rounded">
              <img src={image} alt="" />
            </figure>
          </div>

          <div className="col-lg-6">
            <h2 className="fs-15 text-uppercase text-muted mb-3">{caption}</h2>
            <h3 className="display-4 mb-7">{title}</h3>
            <AccordionList accordions={accordions} id="about16" />
          </div>
        </div>
      </div>
    </section>
  );
}
