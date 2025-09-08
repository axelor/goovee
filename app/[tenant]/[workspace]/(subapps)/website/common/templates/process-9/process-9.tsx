import type {TemplateProps} from '@/subapps/website/common/types';
import {type Process9Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Banner4 from '@/subapps/website/common/components/blocks/banner/Banner4';
import {ServiceCard3} from '@/subapps/website/common/components/reuseable/service-cards';
import dynamic from 'next/dynamic';
import IconProps from '../../types/icons';

function getIcon(icon?: string) {
  if (!icon) return (props: IconProps) => null;
  return dynamic(() => import(`@/subapps/website/common/icons/solid/${icon}`));
}

export function Process9(props: TemplateProps<Process9Data>) {
  const {data} = props;
  const {
    process9Title: title,
    process9Caption: caption,
    process9Description: description,
    process9Image,
    process9BtnColor: btnColor,
    process9Video,
    process9HideShape: hideShape,
    process9Processes: processes,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: process9Image,
    path: 'process9Image',
    ...props,
  });

  const mediaLink = getMetaFileURL({
    metaFile: process9Video,
    path: 'process9Video',
    ...props,
  });

  return (
    <div className="container">
      <div className="row gy-10 gy-sm-13 gx-lg-3 align-items-center mb-14 mb-md-19">
        <div className="col-md-8 col-lg-6 position-relative">
          <Banner4
            thumbnail={image}
            hideShape={hideShape}
            btnColor={btnColor}
            media={mediaLink}
          />
        </div>

        <div className="col-lg-5 col-xl-4 offset-lg-1">
          <h2 className="fs-15 text-uppercase text-muted mb-3">{caption}</h2>
          <h3 className="display-4">{title}</h3>
          <p className="mb-8">{description}</p>

          {processes?.map(({id, attrs: item}) => {
            const Icon = getIcon(item.icon);
            return (
              <ServiceCard3
                key={id}
                title={item.title}
                description={item.description}
                className={item.className}
                Icon={<Icon className="solid icon-svg-sm text-primary me-5" />}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
