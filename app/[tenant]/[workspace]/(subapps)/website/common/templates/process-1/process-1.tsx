import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import {ProcessList1} from '@/subapps/website/common/components/reuseable/process-list';
import type {TemplateProps} from '@/subapps/website/common/types';

type Process1Data = {
  process1Title: string;
  process1Caption: string;
  process1Description1: string;
  process1Description2: string;
  process1LinkText: string;
  process1Link: string;
  process1ProcessList: {
    id: string;
    attrs: {
      title: string;
      subtitle: string;
      className: string;
    };
  }[];
};

export function Process1(props: TemplateProps<Process1Data>) {
  const {data} = props;
  const {
    process1Title: title,
    process1Caption: caption,
    process1Description1: description1,
    process1Description2: description2,
    process1ProcessList: processList,
    process1LinkText: linkText,
    process1Link: link,
  } = data || {};
  return (
    <section className="wrapper bg-light angled upper-start lower-start">
      <div className="container pt-14 pt-md-17">
        <div className="row gx-md-8 gx-xl-12 gy-10 mb-14 mb-md-18 align-items-center">
          <div className="col-lg-6 order-lg-2">
            {processList?.map(item => (
              <ProcessList1
                shadow
                key={item.id}
                no={item.id}
                title={item.attrs.title}
                subtitle={item.attrs.subtitle}
                className={item.attrs.className}
              />
            ))}
          </div>
          <div className="col-lg-6">
            <h2 className="fs-16 text-uppercase text-muted mb-3">{title}</h2>
            <h3 className="display-5 mb-5">{caption}</h3>
            <p>{description1}</p>
            <p className="mb-6">{description2}</p>
            {linkText && (
              <NextLink
                href={link || '#'}
                title={linkText}
                className="btn btn-primary rounded-pill mb-0"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
