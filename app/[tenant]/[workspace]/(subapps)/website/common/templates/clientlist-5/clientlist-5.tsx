import type {TemplateProps} from '@/subapps/website/common/types';
import {type Clientlist5Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import FigureImage from '@/subapps/website/common/components/reuseable/FigureImage';

export function Clientlist5(props: TemplateProps<Clientlist5Data>) {
  const {data} = props;
  const {
    clientlist5Title: title,
    clientlist5Caption: caption,
    clientlist5Description: description,
    clientlist5Clients: clients,
    clientlist5WrapperClassName: wrapperClassName,
    clientlist5ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 gy-lg-0">
          <div className="col-lg-4 mt-lg-2">
            <h2 className="fs-16 text-uppercase text-muted mb-3">{caption}</h2>
            <h3 className="display-5 mb-3 pe-xxl-4">{title}</h3>
            <p className="lead mb-0 pe-xxl-7">{description}</p>
          </div>

          <div className="col-lg-8">
            <div className="row row-cols-2 row-cols-md-4 gx-0 gx-md-8 gx-xl-12 gy-12">
              {clients?.map(({id, attrs: item}, i) => (
                <div className="col" key={id}>
                  <FigureImage
                    width={450}
                    height={301}
                    src={getMetaFileURL({
                      metaFile: item.image,
                      path: `clientlist5Clients[${i}].attrs.image`,
                      ...props,
                    })}
                    className="px-3 px-md-0 px-xxl-2"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
