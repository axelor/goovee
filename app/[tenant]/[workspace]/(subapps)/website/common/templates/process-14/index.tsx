import type {TemplateProps} from '@/subapps/website/common/types';
import {type Process14Data} from './meta';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import ProcessList1 from '@/subapps/website/common/components/reuseable/process-list/ProcessList1';

export default function Process14(props: TemplateProps<Process14Data>) {
  const {data} = props;
  const {
    process14Title: title,
    process14Caption: caption,
    process14Para1: para1,
    process14Para2: para2,
    process14LinkTitle: linkTitle,
    process14LinkHref: linkHref,
    process14Processes: processes,
    process14WrapperClassName: wrapperClassName,
    process14ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-md-8 gx-xl-12 gy-10 align-items-center">
          <div className="col-lg-6 order-lg-2">
            {processes?.map(item => (
              <ProcessList1
                shadow
                key={item.id}
                no={item.attrs.no}
                title={item.attrs.title}
                subtitle={item.attrs.subtitle}
                className={item.attrs.className}
              />
            ))}
          </div>

          <div className="col-lg-6">
            <h2 className="fs-16 text-uppercase text-primary mb-3">
              {caption}
            </h2>
            <h3 className="display-3 mb-4">{title}</h3>
            <p>{para1}</p>

            <p className="mb-6">{para2}</p>

            <NextLink
              href={linkHref}
              title={linkTitle}
              className="btn btn-primary rounded-pill mb-0"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
