import type {TemplateProps} from '@/subapps/website/common/types';
import {type Portfolio8Data} from './meta';
import {
  getMetaFileURL,
  getTemplateId,
} from '@/subapps/website/common/utils/helper';
import Link from 'next/link';
import Image from 'next/image';

export function Portfolio8(props: TemplateProps<Portfolio8Data>) {
  const {data} = props;
  const {
    portfolio8Caption: caption,
    portfolio8Description: description,
    portfolio8PortfolioList: portfolioList,
    portfolio8WrapperClassName: wrapperClassName,
    portfolio8ContainerClassName: containerClassName,
  } = data || {};

  const isotopeId = getTemplateId(props);
  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row mb-8 text-center">
          <div className="col-lg-10 col-xl-9 col-xxl-8 mx-auto">
            <h2 className="fs-16 text-uppercase text-primary mb-3">
              {caption}
            </h2>
            <h3 className="display-4">{description}</h3>
          </div>
        </div>

        <div className="grid grid-view projects-masonry">
          <div className="row gx-md-8 gy-10 gy-md-13 isotope" id={isotopeId}>
            {portfolioList?.map(({id, attrs: item}, i) => (
              <div className="project item col-md-6 col-xl-4 product" key={id}>
                <figure className="lift rounded mb-6">
                  <Link href={item.linkUrl || '#'}>
                    <Image
                      src={getMetaFileURL({
                        metaFile: item.image,
                        path: `portfolio8PortfolioList[${i}].attrs.image`,
                        ...props,
                      })}
                      alt={item.title}
                      width={1300}
                      height={1132}
                      style={{width: '100%', height: 'auto'}}
                    />
                  </Link>
                </figure>

                <div className="project-details d-flex justify-content-center flex-column">
                  <div className="post-header">
                    <div className={`post-category mb-2 text-${item.color}`}>
                      {item.category}
                    </div>
                    <h2 className="post-title h3">{item.title}</h2>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
