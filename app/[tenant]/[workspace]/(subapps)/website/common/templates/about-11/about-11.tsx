import type {TemplateProps} from '@/subapps/website/common/types';
import {type About11Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import Tiles10 from '@/subapps/website/common/components/elements/tiles/Tiles10';
import ListColumn from '@/subapps/website/common/components/reuseable/ListColumn';
import {Fragment} from 'react';

export function About11(props: TemplateProps<About11Data>) {
  const {data} = props;
  const {
    about11Title: title,
    about11Caption: caption,
    about11Description: description,
    about11TileImage1,
    about11TileImage2,
    about11TileImage3,
    about11AboutList1: aboutList1,
    about11AboutList2: aboutList2,
    about11WrapperClassName: wrapperClassName,
    about11ContainerClassName: containerClassName,
  } = data || {};

  const tileImage1 = getImage({
    image: about11TileImage1,
    path: 'about11TileImage1',
    ...props,
  });

  const tileImage2 = getImage({
    image: about11TileImage2,
    path: 'about11TileImage2',
    ...props,
  });

  const tileImage3 = getImage({
    image: about11TileImage3,
    path: 'about11TileImage3',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <Fragment>
          <div className="row gx-lg-8 gx-xl-12 gy-10 mb-10 mb-md-12 align-items-center">
            <div className="col-lg-6 order-lg-2">
              <Tiles10
                image1={tileImage1}
                image2={tileImage2}
                image3={tileImage3}
              />
            </div>

            <div className="col-lg-6">
              <h2 className="display-4 mb-3">{caption}</h2>
              <p className="lead fs-lg">{title}</p>
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
