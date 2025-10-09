import type {TemplateProps} from '@/subapps/website/common/types';
import {type Team4Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {TeamCard1} from '@/subapps/website/common/components/reuseable/team-cards';

export function Team4(props: TemplateProps<Team4Data>) {
  const {data} = props;
  const {
    team4Members: members,
    team4WrapperClassName: wrapperClassName,
    team4ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row grid-view gy-6 gy-xl-0">
          {members?.map(({id, attrs: item}, i) => {
            const socialLinks = item.socialLinks?.map(socialLink => ({
              id: socialLink.id,
              icon: `uil uil-${socialLink.attrs.icon || ''}`,
              url: socialLink.attrs.url || '#',
            }));
            return (
              <div className="col-md-6 col-xl-3" key={id}>
                <TeamCard1
                  shadow
                  name={item.name}
                  description={item.description}
                  designation={item.designation}
                  socialLinks={socialLinks || []}
                  image={getMetaFileURL({
                    metaFile: item.image,
                    path: `team4Members[${i}].attrs.image`,
                    ...props,
                  })}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
