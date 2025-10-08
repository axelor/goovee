import type {TemplateProps} from '@/subapps/website/common/types';
import {type About24Data} from './meta';
import {
  getImage,
  getPaddingBottom,
} from '@/subapps/website/common/utils/helper';
import {ProcessList2} from '@/subapps/website/common/components/reuseable/process-list';
import {CountUp} from '@/subapps/website/common/components/reuseable/countup';
import Image from 'next/image';

export function About24(props: TemplateProps<About24Data>) {
  const {data} = props;
  const {
    about24Title: title,
    about24Description: description,
    about24Image,
    about24Heading1: heading1,
    about24Description1: description1,
    about24Heading2: heading2,
    about24Description2: description2,
    about24Heading3: heading3,
    about24FactList: factList,
    about24SkillList: skillList,
    about24List: list,
    about24ProcessList: processList,
    about24WrapperClassName: wrapperClassName,
    about24ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: about24Image,
    path: 'about24Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-md-8 gx-xl-12 gy-6 align-items-center">
          <div className="col-md-8 col-lg-6 mx-auto">
            <div
              className="img-mask mask-1 position-relative"
              style={{paddingBottom: getPaddingBottom(image)}}>
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className="object-fit-cover"
              />
            </div>
          </div>

          <div className="col-lg-6">
            <h2 className="display-5 mb-5">{title}</h2>
            <p className="mb-6">{description}</p>

            <div className="row counter-wrapper gy-6">
              {factList?.map(({id, attrs: item}) => (
                <div className="col-md-4" key={id}>
                  <h3 className="counter">
                    <CountUp end={item.value} suffix={item.suffix} />
                  </h3>
                  <p>{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="row gx-md-8 gx-xl-12 gy-6 mt-8">
          <div className="col-lg-4">
            <h3>{heading1}</h3>
            <p>{description1}</p>

            <ul className="progress-list">
              {skillList?.map(({id, attrs: item}) => (
                <li key={id}>
                  <p>{item.title}</p>
                  <div
                    className="progressbar line primary"
                    data-value={item.value}
                  />
                </li>
              ))}
            </ul>
          </div>

          <div className="col-lg-4">
            <h3>{heading2}</h3>
            <p>{description2}</p>

            <ul className="icon-list bullet-bg bullet-soft-primary">
              {list?.map(({id, attrs: item}) => (
                <li key={id}>
                  <i className="uil uil-check" />
                  {item.title}
                </li>
              ))}
            </ul>
          </div>

          <div className="col-lg-4">
            <h3>{heading3}</h3>

            {processList?.map(({id, attrs: item}, i) => (
              <ProcessList2
                {...item}
                no={`${i + 1}`}
                key={id}
                className="icon btn btn-circle btn-soft-primary pe-none mt-1 me-5"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
