import {TeamCard1} from '@/subapps/website/common/components/reuseable/team-cards';
import {TemplateProps} from '@/subapps/website/common/types';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';

import type {Team1Data} from './meta';

export function Team1(props: TemplateProps<Team1Data>) {
  const {data} = props;
  const {
    team1Title: title,
    team1Caption: caption,
    team1Teams: teams,
    team1WrapperClassName: wrapperClassName,
    team1ContainerClassName: containerClassName,
  } = data || {};
  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="position-relative mt-8 mt-lg-n23 mt-xl-n25">
          <div className="row text-center">
            <div className="col-lg-8 col-xl-7 mx-auto">
              <h2 className="fs-16 text-uppercase text-muted mb-3">{title}</h2>
              <h3 className="display-4 mb-10 px-md-13 px-lg-4 px-xl-0">
                {caption}
              </h3>
            </div>
          </div>

          <div className="position-relative">
            <div
              className="shape bg-dot blue rellax w-16 h-17"
              style={{zIndex: 0, bottom: '0.5rem', right: '-1.7rem'}}
            />
            <div
              className="shape rounded-circle bg-line red rellax w-16 h-16"
              style={{zIndex: 0, top: '0.5rem', left: '-1.7rem'}}
            />

            <div className="row grid-view gy-6 gy-xl-0">
              {teams?.slice(0, 4).map((item, i) => {
                const socialLinks = item.attrs.socialLinks?.map(socialLink => ({
                  id: socialLink.id,
                  icon: `uil uil-${socialLink.attrs.icon || ''}`,
                  url: socialLink.attrs.url || '#',
                }));

                return (
                  <div className="col-md-6 col-xl-3" key={item.id}>
                    <TeamCard1
                      name={item.attrs.name}
                      image={getMetaFileURL({
                        metaFile: item.attrs.image,
                        path: `team1Teams[${i}].attrs.image`,
                        ...props,
                      })}
                      designation={item.attrs.designation}
                      description={item.attrs.description}
                      socialLinks={socialLinks || []}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
