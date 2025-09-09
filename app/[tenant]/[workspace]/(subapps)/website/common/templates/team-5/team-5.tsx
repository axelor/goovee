import type {TemplateProps} from '@/subapps/website/common/types';
import {type Team5Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {TeamCard3} from '@/subapps/website/common/components/reuseable/team-cards';

export function Team5(props: TemplateProps<Team5Data>) {
  const {data} = props;
  const {team5Members: members} = data || {};

  return (
    <div className="container">
      <div className="row grid-view gx-md-8 gx-xl-10 gy-8 gy-lg-0 mb-16 mb-md-19">
        {members?.map(({id, attrs: item}, i) => (
          <div className="col-md-6 col-lg-3" key={id}>
            <TeamCard3
              name={item.name}
              designation={item.designation}
              image={getMetaFileURL({
                metaFile: item.image,
                path: `team5Members[${i}].attrs.image`,
                ...props,
              })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
