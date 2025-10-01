import ListColumn from '@/subapps/website/common/components/reuseable/ListColumn';
import type {TemplateProps} from '@/subapps/website/common/types';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {type About8Data} from './meta';

export function About8(props: TemplateProps<About8Data>) {
  const {data} = props;
  const {
    about8Title: title,
    about8Caption: caption,
    about8Description: description,
    about8Image,
    about8AboutList: aboutList,
    about8WrapperClassName: wrapperClassName,
    about8ContainerClassName: containerClassName,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: about8Image,
    path: 'about8Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 align-items-center">
          <div className="col-lg-7">
            <figure>
              <img className="w-auto" src={image} alt="" />
            </figure>
          </div>

          <div className="col-lg-5">
            <h3 className="display-4 mb-3">{caption}</h3>
            <p className="lead fs-lg lh-sm">{title}</p>
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
