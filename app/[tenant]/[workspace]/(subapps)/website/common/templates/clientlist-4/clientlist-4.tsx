import type {TemplateProps} from '@/subapps/website/common/types';
import {type Clientlist4Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import FigureImage from '@/subapps/website/common/components/reuseable/FigureImage';

export function Clientlist4(props: TemplateProps<Clientlist4Data>) {
  const {data} = props;
  const {
    clientlist4Title: title,
    clientlist4Caption: caption,
    clientlist4Clients: clients,
    clientlist4WrapperClassName: wrapperClassName,
    clientlist4ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 gy-lg-0 mb-10">
          <div className="col-lg-4 mt-lg-2">
            <h3 className="display-4 mb-3">{title}</h3>
            <p className="lead fs-lg mb-0">{caption}</p>
          </div>

          <div className="col-lg-8">
            <div className="row row-cols-2 row-cols-md-4 gx-0 gx-md-8 gx-xl-12 gy-12">
              {clients?.map(({id, attrs: item}, i) => {
                const image = getImage({
                  image: item.image,
                  path: `clientlist4Clients[${i}].attrs.image`,
                  ...props,
                });
                return (
                  <div className="col" key={id}>
                    <FigureImage
                      image={image}
                      className="px-3 px-md-0 px-xxl-2"
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
