import type {TemplateProps} from '@/subapps/website/common/types';
import {type About5Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import ProgressList from '@/subapps/website/common/components/common/ProgressList';
import Image from 'next/image';

export function About5(props: TemplateProps<About5Data>) {
  const {data} = props;
  const {
    about5Title: title,
    about5Image,
    about5ProgressList: progressList,
    about5WrapperClassName: wrapperClassName,
    about5ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: about5Image,
    path: 'about5Image',
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
        <div className="row gy-10 gy-sm-13 gx-lg-8 align-items-center">
          <div className="col-lg-7">
            <figure>
              <Image
                className="w-auto"
                src={image.url}
                alt={image.alt}
                width={image.width}
                height={image.height}
              />
            </figure>
          </div>

          <div className="col-lg-5">
            <h3 className="display-4 mb-6 pe-xxl-6">{title}</h3>
            <ProgressList items={list} />
          </div>
        </div>
      </div>
    </section>
  );
}
