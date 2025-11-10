import type {TemplateProps} from '@/subapps/website/common/types';
import {type Clientlist2Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import Image from 'next/image';

export default function Clientlist2(props: TemplateProps<Clientlist2Data>) {
  const {data} = props;
  const {
    clientlist2Title: title,
    clientlist2Caption: caption,
    clientlist2Clients: clients,
    clientlist2WrapperClassName: wrapperClassName,
    clientlist2ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 gy-lg-0">
          <div className="col-lg-4 text-center text-lg-start">
            <h2 className="display-5 mb-3">{title}</h2>
            <p className="lead fs-lg mb-0 pe-xxl-2">{caption}</p>
          </div>

          <div className="col-lg-8">
            <div className="row row-cols-2 row-cols-md-4 gx-0 gx-md-8 gx-xl-12 gy-11 mt-n10">
              {clients?.map(({id, attrs: item}, i) => {
                const image = getImage({
                  image: item.image,
                  path: `clientlist2Clients[${i}].attrs.image`,
                  ...props,
                });
                return (
                  <div className="col" key={id}>
                    <figure className="px-4 px-lg-3 px-xxl-5">
                      {image?.url && (
                        <Image
                          src={image.url}
                          alt={image.alt}
                          width={image.width}
                          height={image.height}
                        />
                      )}
                    </figure>
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
