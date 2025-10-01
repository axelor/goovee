import ListColumn from '@/subapps/website/common/components/reuseable/ListColumn';
// -------- data -------- //
import {TemplateProps} from '@/subapps/website/common/types';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';

import type {Services2Data} from './meta';

export function Service2(props: TemplateProps<Services2Data>) {
  const {data} = props;
  const {
    service2Image,
    service2Title: title,
    service2Caption: caption,
    service2Description: description,
    service2Services: services,
    service2WrapperClassName: wrapperClassName = 'bg-light',
    service2ContainerClassName: containerClassName = '',
  } = data || {};

  const image = getMetaFileURL({
    metaFile: service2Image,
    path: `service2Image`,
    ...props,
  });

  return (
    <section className={`wrapper ${wrapperClassName}`} data-code={props.code}>
      <div className={`container ${containerClassName}`}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 align-items-center">
          <div className="col-lg-7 order-lg-2">
            <figure className="text-center">
              <img className="w-auto" alt="our solutions" src={image} />
            </figure>
          </div>

          <div className="col-lg-5">
            <h2 className="fs-16 text-uppercase text-muted mb-3">{title}</h2>
            <h3 className="display-4 mb-5">{caption}</h3>

            <p className="mb-6">{description}</p>
            <ListColumn
              list={services?.attrs.list}
              bulletColor={services?.attrs.bulletColor}
              rowClass={services?.attrs.rowClass}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
