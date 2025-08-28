import type {TemplateProps} from '@/subapps/website/common/types';
import {type About22Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import AccordionList from '@/subapps/website/common/components/common/AccordionList';

export function About22(props: TemplateProps<About22Data>) {
  const {data} = props;
  const {
    about22Title: title,
    about22Caption: caption,
    about22Image,
    about22Accordions: accordionsList,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: about22Image,
    path: 'about22Image',
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
    <section className="wrapper bg-gradient-reverse-primary">
      <div className="container pb-14 pb-md-16">
        <div className="row gx-lg-8 gx-xl-12 gy-10 align-items-center">
          <div className="col-lg-7">
            <figure>
              <img alt="" className="img-auto" src={image} />
            </figure>
          </div>

          <div className="col-lg-5">
            <h2 className="fs-15 text-uppercase text-primary mb-3">
              {caption}
            </h2>
            <h3 className="display-3 mb-7 pe-xxl-14">{title}</h3>
            <AccordionList accordions={accordions} id="about22" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="divider text-light mx-n2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100">
            <path
              fill="currentColor"
              d="M1260,1.65c-60-5.07-119.82,2.47-179.83,10.13s-120,11.48-180,9.57-120-7.66-180-6.42c-60,1.63-120,11.21-180,16a1129.52,1129.52,0,0,1-180,0c-60-4.78-120-14.36-180-19.14S60,7,30,7H0v93H1440V30.89C1380.07,23.2,1319.93,6.15,1260,1.65Z"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
