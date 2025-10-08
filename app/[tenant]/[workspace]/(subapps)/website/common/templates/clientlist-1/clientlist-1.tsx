import type {TemplateProps} from '@/subapps/website/common/types';
import {type Clientlist1Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import Image from 'next/image';

export function Clientlist1(props: TemplateProps<Clientlist1Data>) {
  const {data} = props;
  const {
    clientlist1Clients: clients,
    clientlist1WrapperClassName: wrapperClassName,
    clientlist1ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-0 gx-md-8 gx-xl-12 gy-8 align-items-center">
          {clients?.map(({id, attrs: item}, i) => {
            const image = getImage({
              image: item.image,
              path: `clientlist1Clients[${i}].attrs.image`,
              ...props,
            });
            return (
              <div className="col-4 col-md-2" key={id}>
                <figure className="px-5 px-md-0 px-lg-2 px-xl-3 px-xxl-4">
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
    </section>
  );
}
