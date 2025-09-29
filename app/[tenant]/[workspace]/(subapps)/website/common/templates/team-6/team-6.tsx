import type {TemplateProps} from '@/subapps/website/common/types';
import {type Team6Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {TeamCard3} from '@/subapps/website/common/components/reuseable/team-cards';
import {Fragment} from 'react';

export function Team6(props: TemplateProps<Team6Data>) {
  const {data} = props;
  const {
    team6Caption: caption,
    team6Title: title,
    team6Members: members,
    team6WrapperClassName: wrapperClassName,
    team6ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <Fragment>
          <div className="row mb-3">
            <div className="col-md-10 col-lg-12 col-xl-10 col-xxl-9 mx-auto text-center">
              <h2 className="fs-15 text-uppercase text-primary mb-3">
                {caption}
              </h2>
              <h3 className="display-4 mb-7 px-lg-13">{title}</h3>
            </div>
          </div>

          <div className="row grid-view gx-md-8 gx-xl-10 gy-8 gy-lg-0">
            {members?.map(({id, attrs: item}, i) => (
              <div className="col-md-6 col-lg-3" key={id}>
                <TeamCard3
                  name={item.name}
                  designation={item.designation}
                  image={getMetaFileURL({
                    metaFile: item.image,
                    path: `team6Members[${i}].attrs.image`,
                    ...props,
                  })}
                />
              </div>
            ))}
          </div>
        </Fragment>
      </div>
    </section>
  );
}
