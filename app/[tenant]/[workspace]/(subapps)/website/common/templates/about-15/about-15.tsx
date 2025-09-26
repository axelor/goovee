import type {TemplateProps} from '@/subapps/website/common/types';
import {type About15Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import ListColumn from '@/subapps/website/common/components/reuseable/ListColumn';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function About15(props: TemplateProps<About15Data>) {
  const {data} = props;
  const {
    about15Caption: caption,
    about15Description: description,
    about15Image,
    about15LinkTitle: linkTitle,
    about15LinkHref: linkHref,
    about15AboutList: aboutList,
    about15WrapperClassName: wrapperClassName,
    about15ContainerClassName: containerClassName,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: about15Image,
    path: 'about15Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 align-items-center">
          <div className="col-lg-6 order-lg-2 position-relative">
            <div
              className="shape rounded-circle bg-line leaf rellax w-18 h-18"
              style={{bottom: '-2.5rem', right: '-1.5rem'}}
            />

            <figure className="rounded">
              <img src={image} alt="" />
            </figure>
          </div>

          <div className="col-lg-6">
            <h3 className="display-6 mb-4">{caption}</h3>
            <p className="mb-5">{description}</p>

            <ListColumn
              list={aboutList?.attrs.list ?? []}
              rowClass={aboutList?.attrs.rowClass}
              bulletColor={aboutList?.attrs.bulletColor}
            />

            <NextLink
              title={linkTitle}
              href={linkHref}
              className="btn btn-soft-primary rounded-pill mt-6 mb-0"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
