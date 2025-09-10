import type {TemplateProps} from '@/subapps/website/common/types';
import {type Portfolio9Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function Portfolio9(props: TemplateProps<Portfolio9Data>) {
  const {data} = props;
  const {
    portfolio9Title: title,
    portfolio9Description: description,
    portfolio9LinkTitle: linkTitle,
    portfolio9LinkHref: linkHref,
    portfolio9Section1Caption: section1Caption,
    portfolio9Section1Heading: section1Heading,
    portfolio9Section1Description: section1Description,
    portfolio9Section1LinkTitle: section1LinkTitle,
    portfolio9Section1LinkHref: section1LinkHref,
    portfolio9Section2Caption: section2Caption,
    portfolio9Section2Heading: section2Heading,
    portfolio9Section2Description: section2Description,
    portfolio9Section2LinkTitle: section2LinkTitle,
    portfolio9Section2LinkHref: section2LinkHref,
    portfolio9Section3Caption: section3Caption,
    portfolio9Section3Heading: section3Heading,
    portfolio9Section3Description: section3Description,
    portfolio9Section3LinkTitle: section3LinkTitle,
    portfolio9Section3LinkHref: section3LinkHref,
    portfolio9Section4Caption: section4Caption,
    portfolio9Section4Heading: section4Heading,
    portfolio9Section4Description: section4Description,
    portfolio9Section4LinkTitle: section4LinkTitle,
    portfolio9Section4LinkHref: section4LinkHref,
    portfolio9Image1,
    portfolio9Image2,
    portfolio9Image3,
    portfolio9Image4,
  } = data || {};

  const image1 = getMetaFileURL({
    metaFile: portfolio9Image1,
    path: 'portfolio9Image1',
    ...props,
  });

  const image2 = getMetaFileURL({
    metaFile: portfolio9Image2,
    path: 'portfolio9Image2',
    ...props,
  });

  const image3 = getMetaFileURL({
    metaFile: portfolio9Image3,
    path: 'portfolio9Image3',
    ...props,
  });

  const image4 = getMetaFileURL({
    metaFile: portfolio9Image4,
    path: 'portfolio9Image4',
    ...props,
  });

  return (
    <section className="wrapper bg-light wrapper-border">
      <div className="container py-14 pt-md-18 pb-md-16">
        <div className="row align-items-center mb-10">
          <div className="col-md-8 col-lg-9 col-xl-8 col-xxl-7 pe-xl-20">
            <h2 className="display-4 mb-3">{title}</h2>
            <p className="lead fs-20 mb-0">{description}</p>
          </div>

          <div className="col-md-4 col-lg-3 ms-md-auto text-md-end mt-5 mt-md-0">
            <NextLink
              title={linkTitle}
              href={linkHref}
              className="btn btn-outline-primary rounded-pill mb-0"
            />
          </div>
        </div>

        <div className="card bg-soft-violet mb-10">
          <div className="card-body p-12 pb-0">
            <div className="row">
              <div className="col-lg-4 pb-12 align-self-center">
                <div className="post-category mb-3 text-violet">
                  {section1Caption}
                </div>
                <h3 className="h1 post-title mb-3">{section1Heading}</h3>
                <p>{section1Description}</p>
                <NextLink
                  title={section1LinkTitle}
                  href={section1LinkHref}
                  className="more hover link-violet"
                />
              </div>

              <div className="col-lg-7 offset-lg-1 align-self-end">
                <figure>
                  <img className="img-fluid" src={image1} alt="" />
                </figure>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-soft-blue mb-10">
          <div className="card-body p-12">
            <div className="row gy-10 align-items-center">
              <div className="col-lg-4 order-lg-2 offset-lg-1">
                <div className="post-category mb-3 text-blue">
                  {section2Caption}
                </div>
                <h3 className="h1 post-title mb-3">{section2Heading}</h3>
                <p>{section2Description}</p>
                <NextLink
                  title={section2LinkTitle}
                  href={section2LinkHref}
                  className="more hover link-blue"
                />
              </div>

              <div className="col-lg-7">
                <figure>
                  <img className="img-fluid" src={image2} alt="" />
                </figure>
              </div>
            </div>
          </div>
        </div>

        <div className="row gx-md-8 gx-xl-10">
          <div className="col-lg-6">
            <div className="card bg-soft-leaf mb-10">
              <div className="card-body p-12 pb-0">
                <div className="post-category mb-3 text-leaf">
                  {section3Caption}
                </div>
                <h3 className="h1 post-title mb-3">{section3Heading}</h3>
                <p>{section3Description}</p>
                <NextLink
                  title={section3LinkTitle}
                  href={section3LinkHref}
                  className="more hover link-leaf mb-8"
                />
              </div>

              <img className="card-img-bottom" src={image3} alt="" />
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card bg-soft-pink">
              <div className="card-body p-12 pb-0">
                <div className="post-category mb-3 text-pink">
                  {section4Caption}
                </div>
                <h3 className="h1 post-title mb-3">{section4Heading}</h3>
                <p>{section4Description}</p>
                <NextLink
                  title={section4LinkTitle}
                  href={section4LinkHref}
                  className="more hover link-pink mb-8"
                />
              </div>

              <img className="card-img-bottom" src={image4} alt="" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
