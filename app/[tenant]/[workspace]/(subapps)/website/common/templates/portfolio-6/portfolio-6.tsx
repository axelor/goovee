import type {TemplateProps} from '@/subapps/website/common/types';
import {type Portfolio6Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import Link from 'next/link';
import Image from 'next/image';

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
    portfolio6Image1Width,
    portfolio6Image1Height,
    portfolio6Image2Width,
    portfolio6Image2Height,
    portfolio6Image3Width,
    portfolio6Image3Height,
    portfolio6WrapperClassName: wrapperClassName,
    portfolio6ContainerClassName: containerClassName,
  } = data || {};

  const image1 = getImage({
    image: portfolio6Image1,
    path: 'portfolio6Image1',
    ...props,
  });
  const image2 = getImage({
    image: portfolio6Image2,
    path: 'portfolio6Image2',
    ...props,
  });
  const image3 = getImage({
    image: portfolio6Image3,
    path: 'portfolio6Image3',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="projects-tiles">
          <div className="project grid grid-view">
            <div className="row gx-md-8 gx-xl-12 gy-10 gy-md-12">
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
                      <Image
                        src={image2.url}
                        alt={image2.alt || ''}
                        width={image2.width}
                        height={image2.height}
                      />
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
                      <Image
                        src={image1.url}
                        alt={image1.alt || ''}
                        width={image1.width}
                        height={image1.height}
                      />
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
                      <Image
                        src={image3.url}
                        alt={image3.alt || ''}
                        width={image3.width}
                        height={image3.height}
                      />
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
      </div>
    </section>
  );
}
