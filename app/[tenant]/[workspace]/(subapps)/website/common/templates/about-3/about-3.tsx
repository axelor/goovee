import type {TemplateProps} from '@/subapps/website/common/types';
import {type About3Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import AccordionList from '@/subapps/website/common/components/common/AccordionList';

export function About3(props: TemplateProps<About3Data>) {
  const {data} = props;
  const {
    about3Title: title,
    about3Caption: caption,
    about3Image,
    about3Accordions: accordionsList,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: about3Image,
    path: 'about3Image',
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
      <div className="row gy-10 gy-sm-13 gx-lg-3 align-items-center">
        <div className="col-md-8 col-lg-6 offset-lg-1 order-lg-2 position-relative">
          <div
            className="shape rounded-circle bg-line primary rellax w-18 h-18"
            style={{top: '-2rem', right: '-1.9rem'}}
          />

          <div
            className="shape rounded bg-soft-primary rellax d-md-block"
            style={{
              width: '85%',
              height: '90%',
              left: '-1.5rem',
              bottom: '-1.8rem',
            }}
          />

          <figure className="rounded">
            <img src={image} alt="about" />
          </figure>
        </div>

        <div className="col-lg-5">
          <h2 className="fs-16 text-uppercase text-line text-primary mb-3">
            {caption}
          </h2>
          <h3 className="display-5 mb-7">{title}</h3>
          <div className="accordion accordion-wrapper">
            <AccordionList id="about3" accordions={accordions} />
          </div>
        </div>
      </div>
    </div>
  );
}
