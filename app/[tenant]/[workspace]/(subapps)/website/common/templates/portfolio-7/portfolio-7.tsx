import type {TemplateProps} from '@/subapps/website/common/types';
import {type Portfolio7Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Link from 'next/link';

export function Portfolio7(props: TemplateProps<Portfolio7Data>) {
  const {data} = props;
  const {
    portfolio7Title: title,
    portfolio7Description: description,
    portfolio7Image1,
    portfolio7Caption1,
    portfolio7Title1,
    portfolio7Image2,
    portfolio7Caption2,
    portfolio7Title2,
    portfolio7Image3,
    portfolio7Caption3,
    portfolio7Title3,
    portfolio7Image1Link,
    portfolio7Image2Link,
    portfolio7Image3Link,
  } = data || {};

  const image1 = getMetaFileURL({
    metaFile: portfolio7Image1,
    path: 'portfolio7Image1',
    ...props,
  });

  const image2 = getMetaFileURL({
    metaFile: portfolio7Image2,
    path: 'portfolio7Image2',
    ...props,
  });

  const image3 = getMetaFileURL({
    metaFile: portfolio7Image3,
    path: 'portfolio7Image3',
    ...props,
  });

  return (
    <div className="container">
      <div className="projects-tiles">
        <div className="project grid grid-view">
          <div className="row gx-md-8 gx-xl-12 gy-10 gy-md-12">
            <div className="col-md-6">
              <div className="item">
                <Link href={portfolio7Image1Link || '#'} passHref>
                  <figure className="lift rounded mb-6">
                    <img src={image1} alt="" />
                  </figure>
                </Link>

                <div className="post-category text-line mb-3 text-violet">
                  {portfolio7Caption1}
                </div>
                <h2 className="post-title h3">{portfolio7Title1}</h2>
              </div>

              <div className="item mt-12">
                <Link href={portfolio7Image3Link || '#'} passHref>
                  <figure className="lift rounded mb-6">
                    <img src={image3} alt="" />
                  </figure>
                </Link>

                <div className="post-category text-line mb-3 text-purple">
                  {portfolio7Caption3}
                </div>
                <h2 className="post-title h3">{portfolio7Title3}</h2>
              </div>
            </div>
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
                <Link href={portfolio7Image2Link || '#'} passHref>
                  <figure className="lift rounded mb-6">
                    <img src={image2} alt="demo" />
                  </figure>
                </Link>

                <div className="post-category text-line mb-3 text-leaf">
                  {portfolio7Caption2}
                </div>
                <h2 className="post-title h3">{portfolio7Title2}</h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
