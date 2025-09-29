import type {TemplateProps} from '@/subapps/website/common/types';
import {type About6Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import ListColumn from '@/subapps/website/common/components/reuseable/ListColumn';
import {Tiles5} from '@/subapps/website/common/components/elements/tiles';

export function About6(props: TemplateProps<About6Data>) {
  const {data} = props;
  const {
    about6Title: title,
    about6LeadParagraph: leadParagraph,
    about6Paragraph: paragraph,
    about6Image1,
    about6Image2,
    about6List,
    about6WrapperClassName: wrapperClassName,
    about6ContainerClassName: containerClassName,
  } = data || {};

  const image1 = getMetaFileURL({
    metaFile: about6Image1,
    path: 'about6Image1',
    ...props,
  });

  const image2 = getMetaFileURL({
    metaFile: about6Image2,
    path: 'about6Image2',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 align-items-center">
          <div className="col-lg-6 position-relative order-lg-2">
            <Tiles5 images={[image1, image2]} />
          </div>

          <div className="col-lg-6">
            <h2 className="display-4 mb-3">{title}</h2>

            <p className="lead fs-lg">{leadParagraph}</p>

            <p className="mb-6">{paragraph}</p>

            <ListColumn
              rowClass={about6List?.attrs?.rowClass || 'gx-xl-8'}
              list={about6List?.attrs.list}
              bulletColor={about6List?.attrs.bulletColor}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
