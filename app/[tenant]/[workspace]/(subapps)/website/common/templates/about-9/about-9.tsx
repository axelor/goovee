import type {TemplateProps} from '@/subapps/website/common/types';
import {type About9Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import {ServiceCard3} from '@/subapps/website/common/components/reuseable/service-cards';
import Design from '@/subapps/website/common/icons/solid/Design';
import dynamic from 'next/dynamic';
import Image from 'next/image';

function getIcon(icon: string) {
  return icon
    ? dynamic(() =>
        import(`@/subapps/website/common/icons/solid/${icon}`).catch(err => {
          return Design;
        }),
      )
    : Design;
}

export function About9(props: TemplateProps<About9Data>) {
  const {data} = props;
  const {
    about9Title: title,
    about9Caption: caption,
    about9Description: description,
    about9Image,
    about9AboutList: aboutList,
    about9WrapperClassName: wrapperClassName,
    about9ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: about9Image,
    path: 'about9Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 align-items-center">
          <div className="col-md-8 col-lg-6 position-relative">
            <div
              className="shape bg-soft-primary rounded-circle rellax w-20 h-20"
              style={{top: '-2rem', left: '-1.9rem'}}
            />

            <figure className="rounded">
              <Image
                src={image.url}
                alt={image.alt}
                width={image.width}
                height={image.height}
              />
            </figure>
          </div>

          <div className="col-lg-6">
            <h2 className="display-4 mb-3">{caption}</h2>
            <p className="lead fs-lg">{title}</p>
            <p className="mb-6">{description}</p>

            <div className="row gx-xl-10 gy-6">
              {aboutList?.map(({id, attrs: item}) => {
                const Icon = getIcon(item.icon ?? '');
                return (
                  <div className="col-md-6" key={id}>
                    <ServiceCard3
                      title={item.title}
                      description={item.description}
                      Icon={
                        Icon ? (
                          <Icon className="solid icon-svg-sm text-aqua me-4" />
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
    </section>
  );
}
