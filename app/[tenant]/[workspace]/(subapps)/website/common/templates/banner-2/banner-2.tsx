import type {TemplateProps} from '@/subapps/website/common/types';
import {type Banner2Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';

export function Banner2(props: TemplateProps<Banner2Data>) {
  const {data} = props;
  const {
    banner2Heading: heading,
    banner2Image,
    banner2WrapperClassName: wrapperClassName = 'text-white',
    banner2ContainerClassName:
      containerClassName = 'py-16 py-md-19 text-center',
  } = data || {};

  const image = getMetaFileURL({
    metaFile: banner2Image,
    path: 'banner2Image',
    ...props,
  });

  return (
    <section
      className={`wrapper mobile image-wrapper bg-image bg-overlay ${wrapperClassName}`}
      data-code={props.code}
      style={{backgroundImage: `url(${image})`}}>
      <div className={`container ${containerClassName}`}>
        <h2 className="display-1 text-white mb-0">{heading}</h2>
      </div>
    </section>
  );
}
