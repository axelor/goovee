import type {TemplateProps} from '@/subapps/website/common/types';
import {type Portfolio5Data} from './meta';
import {
  getMetaFileURL,
  getTemplateId,
} from '@/subapps/website/common/utils/helper';
import {Filter} from './filter';

export function Portfolio5(props: TemplateProps<Portfolio5Data>) {
  const {data} = props;
  const {
    portfolio5Description: description,
    portfolio5Caption: caption,
    portfolio5List: list,
    portfolio5FilterList: filterList,
    portfolio5WrapperClassName: wrapperClassName = 'bg-gray',
    portfolio5ContainerClassName:
      containerClassName = 'py-15 py-md-17 text-center',
  } = data || {};

  const isotopeId = getTemplateId(props);
  return (
    <section className={`wrapper ${wrapperClassName}`} data-code={props.code}>
      <div className={`container ${containerClassName}`}>
        <div className="row">
          <div className="col-lg-11 col-xl-9 col-xxl-8 mx-auto mb-8">
            <h2 className="display-5 mb-3">{caption}</h2>
            <p className="lead fs-lg">{description}</p>
          </div>
        </div>

        <div className="grid grid-view projects-masonry">
          <div className="isotope-filter filter mb-10">
            <ul>
              <Filter list={list} selector={`#${isotopeId}`} />
            </ul>
          </div>

          <div className="row gx-md-6 gy-6 isotope" id={isotopeId}>
            {filterList?.map(({id, attrs: item}, i) => (
              <div
                className={`project item col-md-6 col-xl-4 ${item.category}`}
                key={id}>
                <figure className="overlay overlay-1 rounded">
                  <a
                    href={getMetaFileURL({
                      metaFile: item.fullImage,
                      path: `portfolio5FilterList[${i}].attrs.fullImage`,
                      ...props,
                    })}
                    data-glightbox
                    data-gallery="shots-group">
                    <img
                      width={item.imageWidth}
                      height={item.imageHeight}
                      src={getMetaFileURL({
                        metaFile: item.image,
                        path: `portfolio5FilterList[${i}].attrs.image`,
                        ...props,
                      })}
                      alt={item.title}
                    />
                    <span className="bg" />
                  </a>
                  <figcaption>
                    <h5 className="from-top mb-0">{item.title}</h5>
                  </figcaption>
                </figure>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
