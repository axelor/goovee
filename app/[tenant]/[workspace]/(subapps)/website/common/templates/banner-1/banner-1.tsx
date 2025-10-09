import type {TemplateProps} from '@/subapps/website/common/types';
import {type Banner1Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import GoogleAppBtn from '@/subapps/website/common/components/common/GoogleAppBtn';

export function Banner1(props: TemplateProps<Banner1Data>) {
  const {data} = props;
  const {
    banner1Heading: heading,
    banner1Title: title,
    banner1Image,
    banner1Button1: button1,
    banner1Button2: button2,
    banner1WrapperClassName: wrapperClassName,
    banner1ContainerClassName: containerClassName,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: banner1Image,
    path: 'banner1Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 align-items-center">
          <div className="col-lg-6">
            <img alt="" src={image} className="w-100" />
          </div>

          <div className="col-md-10 offset-md-1 offset-lg-0 col-lg-6 mt-md-n9 text-center text-lg-start">
            <h1 className="display-4 mb-4 px-md-10 px-lg-0">{heading}</h1>

            <p className="lead fs-lg mb-7 px-md-10 px-lg-0 pe-xxl-15">
              {title}
            </p>

            <GoogleAppBtn
              googlePlayTitle={button1}
              appStoreTitle={button2}
              googlePlayUrl="#"
              appStoreUrl="#"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
