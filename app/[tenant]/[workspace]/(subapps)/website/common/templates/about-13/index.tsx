import type {TemplateProps} from '@/subapps/website/common/types';
import {type About13Data} from './meta';
import {getImage, getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Banner4 from '@/subapps/website/common/components/blocks/banner/Banner4';
import ListColumn from '@/subapps/website/common/components/reuseable/ListColumn';

export default function About13(props: TemplateProps<About13Data>) {
  const {data} = props;
  const {
    about13Title: title,
    about13Caption: caption,
    about13Description: description,
    about13Image,
    about13BtnColor: btnColor,
    about13Media: media,
    about13HideShape: hideShape,
    about13AboutList: aboutList,
    about13WrapperClassName: wrapperClassName,
    about13ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: about13Image,
    path: 'about13Image',
    ...props,
  });

  const mediaFile = getMetaFileURL({
    metaFile: media,
    path: 'about13Media',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gy-10 gy-sm-13 gx-lg-3 align-items-center">
          <div className="col-md-8 col-lg-6 position-relative">
            <Banner4
              thumbnail={image}
              hideShape={hideShape}
              btnColor={btnColor}
              media={mediaFile}
              mediaType={media?.fileType}
            />
          </div>

          <div className="col-lg-5 offset-lg-1">
            <h2 className="fs-15 text-uppercase text-primary mb-3">
              {caption}
            </h2>
            <h3 className="display-5 mb-6">{title}</h3>
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
