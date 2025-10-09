import type {TemplateProps} from '@/subapps/website/common/types';
import {type Clientlist1Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';

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
          {clients?.map(({id, attrs: item}, i) => (
            <div className="col-4 col-md-2" key={id}>
              <figure className="px-5 px-md-0 px-lg-2 px-xl-3 px-xxl-4">
                <img
                  src={getMetaFileURL({
                    metaFile: item.image,
                    path: `clientlist1Clients[${i}].attrs.image`,
                    ...props,
                  })}
                  alt="client"
                />
              </figure>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
