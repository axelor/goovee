import type {TemplateProps} from '@/subapps/website/common/types';
import {type Portfolio11Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {ProjectCard3} from '@/subapps/website/common/components/reuseable/project-cards';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function Portfolio11(props: TemplateProps<Portfolio11Data>) {
  const {data} = props;
  const {
    portfolio11Caption: caption,
    portfolio11Description: description,
    portfolio11LinkTitle: linkTitle,
    portfolio11LinkHref: linkHref,
    portfolio11PortfolioList: portfolioList,
  } = data || {};

  return (
    <section className="wrapper bg-light">
      <div className="container py-15 py-md-17">
        <div className="row">
          <div className="col-lg-11 col-xl-10 mx-auto mb-10">
            <h2 className="fs-16 text-uppercase text-muted text-center mb-3">
              {caption}
            </h2>
            <h3 className="display-3 text-center px-lg-5 px-xl-10 mb-0">
              {description}
            </h3>
          </div>
        </div>

        <div className="grid grid-view projects-masonry">
          <div className="row gx-md-8 gy-10 gy-md-13">
            {portfolioList?.map(({id, attrs: item}, i) => (
              <div className="project item col-md-6 col-xl-4" key={id}>
                <ProjectCard3
                  {...item}
                  image={getMetaFileURL({
                    metaFile: item.image,
                    path: `portfolio11PortfolioList[${i}].attrs.image`,
                    ...props,
                  })}
                  fullImage={getMetaFileURL({
                    metaFile: item.fullImage,
                    path: `portfolio11PortfolioList[${i}].attrs.fullImage`,
                    ...props,
                  })}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-10">
          <NextLink
            title={linkTitle}
            href={linkHref}
            className="btn btn-lg btn-primary rounded-pill"
          />
        </div>
      </div>
    </section>
  );
}
