import type {TemplateProps} from '@/subapps/website/common/types';
import {type Clientlist4Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import FigureImage from '@/subapps/website/common/components/reuseable/FigureImage';

export function Clientlist4(props: TemplateProps<Clientlist4Data>) {
  const {data} = props;
  const {
    clientlist4Title: title,
    clientlist4Caption: caption,
    clientlist4Clients: clients,
    clientlist4WrapperClassName: wrapperClassName = 'bg-gray',
    clientlist4ContainerClassName: containerClassName = 'py-14 py-md-16',
  } = data || {};

  return (
    <section className={`wrapper ${wrapperClassName}`} data-code={props.code}>
      <div className={`container ${containerClassName}`}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 gy-lg-0 mb-10">
          <div className="col-lg-4 mt-lg-2">
            <h3 className="display-4 mb-3">{title}</h3>
            <p className="lead fs-lg mb-0">{caption}</p>
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
                      path: `clientlist4Clients[${i}].attrs.image`,
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
