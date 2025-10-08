import type {TemplateProps} from '@/subapps/website/common/types';
import {type Banner2Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';

export function Banner2(props: TemplateProps<Banner2Data>) {
  const {data} = props;
  const {
    banner2Heading: heading,
    banner2Image,
    banner2WrapperClassName: wrapperClassName,
    banner2ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: banner2Image,
    path: 'banner2Image',
    ...props,
  });

  return (
    <section
      className={wrapperClassName}
      data-code={props.code}
      style={{backgroundImage: `url(${image.url})`}}>
      <div className={containerClassName}>
        <h2 className="display-1 text-white mb-0">{heading}</h2>
      </div>
    </section>
  );
}
