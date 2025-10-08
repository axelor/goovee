import type {TemplateProps} from '@/subapps/website/common/types';
import {type About18Data} from './meta';
import {
  getImage,
  getPaddingBottom,
} from '@/subapps/website/common/utils/helper';
import {CountUp} from '@/subapps/website/common/components/reuseable/countup';
import CloudGroup from '@/subapps/website/common/icons/solid-duo/CloudGroup';
import ListColumn from '@/subapps/website/common/components/reuseable/ListColumn';
import Image from 'next/image';

export function About18(props: TemplateProps<About18Data>) {
  const {data} = props;
  const {
    about18Title: title,
    about18Caption: caption,
    about18Description: description,
    about18Image,
    about18Heading1: heading1,
    about18Heading2: heading2,
    about18CountUp: countUp,
    about18Suffix: suffix,
    about18DataValue: dataValue,
    about18AboutList: aboutList,
    about18WrapperClassName: wrapperClassName,
    about18ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: about18Image,
    path: 'about18Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-md-8 gy-10 align-items-center">
          <div className="col-lg-6 offset-lg-1 order-lg-2 position-relative">
            <figure
              className="rounded position-relative"
              style={{paddingBottom: getPaddingBottom(image)}}>
              <Image
                className="img-fluid object-fit-cover"
                src={image.url}
                fill
                alt={image.alt}
              />
            </figure>

            <div
              className="card shadow-lg position-absolute d-none d-md-block"
              style={{top: '15%', left: '-7%'}}>
              <div className="card-body py-4 px-5">
                <div className="d-flex flex-row align-items-center">
                  <div>
                    <CloudGroup />
                  </div>
                  <div>
                    <h3 className="fs-25 counter mb-0 text-nowrap">
                      <CountUp end={countUp} suffix={suffix} />
                    </h3>
                    <p className="fs-16 lh-sm mb-0 text-nowrap">{heading1}</p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="card shadow-lg position-absolute text-center d-none d-md-block"
              style={{bottom: '10%', left: '-10%'}}>
              <div className="card-body p-6">
                <div
                  className="progressbar semi-circle fuchsia mb-3"
                  data-value={dataValue}
                />
                <h4 className="mb-0">{heading2}</h4>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <h2 className="fs-16 text-uppercase text-gradient gradient-1 mb-3">
              {caption}
            </h2>
            <h3 className="display-5 mb-4 me-lg-n5">{title}</h3>
            <p className="mb-6">{description}</p>

            <ListColumn
              list={aboutList?.attrs.list ?? []}
              rowClass={aboutList?.attrs.rowClass}
              bulletColor={aboutList?.attrs.bulletColor}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
