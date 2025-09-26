import type {TemplateProps} from '@/subapps/website/common/types';
import {type Portfolio6Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Link from 'next/link';

export function Portfolio6(props: TemplateProps<Portfolio6Data>) {
  const {data} = props;
  const {
    portfolio6Title: title,
    portfolio6Description: description,
    portfolio6Image1,
    portfolio6Caption1,
    portfolio6Title1,
    portfolio6Image2,
    portfolio6Caption2,
    portfolio6Title2,
    portfolio6Image3,
    portfolio6Caption3,
    portfolio6Title3,
    portfolio6Image1Link,
    portfolio6Image2Link,
    portfolio6Image3Link,
  } = data || {};

  const image1 = getMetaFileURL({
    metaFile: portfolio6Image1,
    path: 'portfolio6Image1',
    ...props,
  });

  const image2 = getMetaFileURL({
    metaFile: portfolio6Image2,
    path: 'portfolio6Image2',
    ...props,
  });

  const image3 = getMetaFileURL({
    metaFile: portfolio6Image3,
    path: 'portfolio6Image3',
    ...props,
  });

  return (
    <div className="projects-tiles">
      <div className="project grid grid-view">
        <div className="row gx-md-8 gx-xl-12 gy-10 gy-md-12 isotope">
          <div className="col-md-6">
            <div className="item mt-md-7 mt-lg-15">
              <div className="project-details d-flex justify-content-center align-self-end flex-column ps-0 pb-0">
                <div className="post-header">
                  <h2 className="display-4 mb-4 pe-xxl-15">{title}</h2>
                  <p className="lead fs-lg mb-0">{description}</p>
                </div>
              </div>
            </div>

            <div className="item mt-12">
              <Link href={portfolio6Image2Link || '#'} passHref>
                <figure className="lift rounded mb-6">
                  <img src={image2} alt="demo" />
                </figure>
              </Link>

              <div className="post-category text-line mb-3 text-leaf">
                {portfolio6Caption2}
              </div>
              <h2 className="post-title h3">{portfolio6Title2}</h2>
            </div>
          </div>

          <div className="col-md-6">
            <div className="item">
              <Link href={portfolio6Image1Link || '#'} passHref>
                <figure className="lift rounded mb-6">
                  <img src={image1} alt="" />
                </figure>
              </Link>

              <div className="post-category text-line mb-3 text-violet">
                {portfolio6Caption1}
              </div>
              <h2 className="post-title h3">{portfolio6Title1}</h2>
            </div>

            <div className="item mt-12">
              <Link href={portfolio6Image3Link || '#'} passHref>
                <figure className="lift rounded mb-6">
                  <img src={image3} alt="" />
                </figure>
              </Link>

              <div className="post-category text-line mb-3 text-purple">
                {portfolio6Caption3}
              </div>
              <h2 className="post-title h3">{portfolio6Title3}</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
