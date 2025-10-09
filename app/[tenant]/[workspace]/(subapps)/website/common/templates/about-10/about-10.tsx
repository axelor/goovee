import Banner4 from '@/subapps/website/common/components/blocks/banner/Banner4';
import ProgressList from '@/subapps/website/common/components/common/ProgressList';
import type {TemplateProps} from '@/subapps/website/common/types';
import {getImage, getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {type About10Data} from './meta';

export function About10(props: TemplateProps<About10Data>) {
  const {data} = props;
  const {
    about10Title: title,
    about10Caption: caption,
    about10Image,
    about10BtnColor: btnColor,
    about10Media: media,
    about10HideShape: hideShape,
    about10ProgressList: progressList,
    about10WrapperClassName: wrapperClassName,
    about10ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: about10Image,
    path: 'about10Image',
    ...props,
  });

  const mediaFile = getMetaFileURL({
    metaFile: media,
    path: 'about10Media',
    ...props,
  });

  const list =
    progressList?.map(({id, attrs: item}) => ({
      id,
      percent: item.percent,
      title: item.title,
      color: item.color,
    })) ?? [];

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

          <div className="col-lg-5 col-xl-4 offset-lg-1">
            <h3 className="display-4 mb-3">{caption}</h3>
            <p className="lead fs-lg mb-6">{title}</p>

            <ProgressList items={list} />
          </div>
        </div>
      </div>
    </section>
  );
}
