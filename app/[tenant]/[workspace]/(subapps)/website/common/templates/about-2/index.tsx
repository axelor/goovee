import type {TemplateProps} from '@/subapps/website/common/types';
import {type About2Data} from './meta';
import {getImage, getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Banner4 from '@/subapps/website/common/components/blocks/banner/Banner4';
import ListColumn from '@/subapps/website/common/components/reuseable/ListColumn';

export default function About2(props: TemplateProps<About2Data>) {
  const {data} = props;
  const {
    about2Title: title,
    about2Caption: caption,
    about2Para: para,
    about2Thumbnail,
    about2HideShape: hideShape,
    about2BtnColor: btnColor,
    about2Media,
    about2Aboutlist: aboutlist,
    about2WrapperClassName: wrapperClassName,
    about2ContainerClassName: containerClassName,
  } = data || {};

  const thumbnail = getImage({
    image: about2Thumbnail,
    path: 'about2Thumbnail',
    ...props,
  });

  const media = getMetaFileURL({
    metaFile: about2Media,
    path: 'about2Media',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gy-10 gy-sm-13 gx-lg-3 align-items-center">
          <div className="col-md-8 col-lg-6 position-relative">
            <Banner4
              thumbnail={thumbnail}
              hideShape={hideShape}
              btnColor={btnColor}
              media={media}
              mediaType={about2Media?.fileType}
            />
          </div>

          <div className="col-lg-5 offset-lg-1">
            <h2 className="fs-15 text-uppercase text-muted mb-3">{caption}</h2>
            <h3 className="display-4 mb-6">{title}</h3>

            <p className="mb-6">{para}</p>
            <ListColumn
              list={aboutlist?.attrs.list ?? []}
              rowClass={aboutlist?.attrs.rowClass}
              bulletColor={aboutlist?.attrs.bulletColor}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
