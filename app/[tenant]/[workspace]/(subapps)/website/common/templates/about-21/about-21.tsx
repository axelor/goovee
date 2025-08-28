import type {TemplateProps} from '@/subapps/website/common/types';
import {type About21Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Banner4 from '@/subapps/website/common/components/blocks/banner/Banner4';
import {ServiceCard3} from '@/subapps/website/common/components/reuseable/service-cards';
import Design from '@/subapps/website/common/icons/solid/Design';
import dynamic from 'next/dynamic';

function getIcon(icon: string) {
  return icon
    ? dynamic(() =>
        import(`@/subapps/website/common/icons/solid/${icon}`).catch(err => {
          return Design;
        }),
      )
    : Design;
}

export function About21(props: TemplateProps<About21Data>) {
  const {data} = props;
  const {
    about21Caption: caption,
    about21Description: description,
    about21Image,
    about21BtnColor: btnColor,
    about21Media: media,
    about21HideShape: hideShape,
    about21AboutList: aboutList,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: about21Image,
    path: 'about21Image',
    ...props,
  });

  const mediaFile = getMetaFileURL({
    metaFile: media,
    path: 'about21Media',
    ...props,
  });

  return (
    <div className="container">
      <div className="row gy-10 gy-sm-13 gx-md-8 gx-xl-12 align-items-center mb-15 mb-md-17">
        <div className="col-lg-6 position-relative">
          <Banner4
            thumbnail={image}
            hideShape={hideShape}
            btnColor={btnColor}
            media={mediaFile}
            mediaType={media?.fileType}
          />
        </div>

        <div className="col-lg-6">
          <h2 className="fs-16 text-uppercase text-muted mb-3">{caption}</h2>
          <h3 className="display-3 mb-8">{description}</h3>
          <div className="row gy-6">
            {aboutList?.map(({id, attrs: item}) => {
              const Icon = getIcon(item.icon ?? '');
              return (
                <div className="col-md-6" key={id}>
                  <ServiceCard3
                    title={item.title}
                    description={item.description}
                    Icon={
                      Icon ? (
                        <Icon className="icon-svg-xs solid-duo text-purple-pink me-4" />
                      ) : null
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
