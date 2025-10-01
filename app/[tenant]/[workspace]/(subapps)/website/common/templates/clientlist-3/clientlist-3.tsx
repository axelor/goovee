import type {TemplateProps} from '@/subapps/website/common/types';
import {type Clientlist3Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {Fragment} from 'react';

export function Clientlist3(props: TemplateProps<Clientlist3Data>) {
  const {data} = props;
  const {
    clientlist3Caption: caption,
    clientlist3Clients: clients,
    clientlist3WrapperClassName: wrapperClassName,
    clientlist3ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <Fragment>
          <h2 className="fs-15 text-uppercase text-muted text-center mb-8">
            {caption}
          </h2>
          <div className="px-lg-5">
            <div className="row gx-0 gx-md-8 gx-xl-12 gy-8 align-items-center">
              {clients?.map(({id, attrs: item}, i) => (
                <div className="col-4 col-md-2" key={id}>
                  <figure className="px-5 px-md-0 px-lg-2 px-xl-3 px-xxl-4">
                    <img
                      src={getMetaFileURL({
                        metaFile: item.image,
                        path: `clientlist3Clients[${i}].attrs.image`,
                        ...props,
                      })}
                      alt="client"
                    />
                  </figure>
                </div>
              ))}
            </div>
          </div>
        </Fragment>
      </div>
    </section>
  );
}
