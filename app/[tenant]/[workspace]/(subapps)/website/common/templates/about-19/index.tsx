import type {TemplateProps} from '@/subapps/website/common/types';
import {type About19Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import Tiles11 from '@/subapps/website/common/components/elements/tiles/Tiles11';
import ListColumn from '@/subapps/website/common/components/reuseable/ListColumn';
import {Fragment} from 'react';

export default function About19(props: TemplateProps<About19Data>) {
  const {data} = props;
  const {
    about19Title: title,
    about19Caption: caption,
    about19Description: description,
    about19TileImage1,
    about19TileImage2,
    about19TileImage3,
    about19AboutList1: aboutList1,
    about19AboutList2: aboutList2,
    about19WrapperClassName: wrapperClassName,
    about19ContainerClassName: containerClassName,
  } = data || {};

  const tileImage1 = getImage({
    image: about19TileImage1,
    path: 'about19TileImage1',
    ...props,
  });

  const tileImage2 = getImage({
    image: about19TileImage2,
    path: 'about19TileImage2',
    ...props,
  });

  const tileImage3 = getImage({
    image: about19TileImage3,
    path: 'about19TileImage3',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <Fragment>
          <div className="row gy-10 gy-sm-13 gx-md-8 gx-xl-12 align-items-center mb-10 mb-md-12">
            <div className="col-lg-6">
              <Tiles11
                image1={tileImage1}
                image2={tileImage2}
                image3={tileImage3}
              />
            </div>

            <div className="col-lg-6">
              <h2 className="fs-16 text-uppercase text-gradient gradient-1 mb-3">
                {caption}
              </h2>
              <h3 className="display-4 mb-4">{title}</h3>
              <p className="mb-6">{description}</p>

              <ListColumn
                list={aboutList1?.attrs.list ?? []}
                rowClass={aboutList1?.attrs.rowClass}
                bulletColor={aboutList1?.attrs.bulletColor}
              />
            </div>
          </div>

          <div className="row gx-lg-8 gx-xl-12 gy-6">
            {aboutList2?.map(({id, attrs: item}, i) => (
              <div className="col-lg-4" key={id}>
                <div className="d-flex flex-row">
                  <div>
                    <div className="icon btn btn-circle pe-none btn-soft-primary me-4">
                      <span className="number fs-18">{i + 1}</span>
                    </div>
                  </div>

                  <div>
                    <h4>{item.title}</h4>
                    <p className="mb-2">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Fragment>
      </div>
    </section>
  );
}
