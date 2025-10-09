import type {TemplateProps} from '@/subapps/website/common/types';
import {type Team3Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';
import {TeamCard1} from '@/subapps/website/common/components/reuseable/team-cards';

export function Team3(props: TemplateProps<Team3Data>) {
  const {data} = props;
  const {
    team3Title: title,
    team3SpaceBetween: spaceBetween,
    team3Navigation: navigation,
    team3Members: members = [],
    team3WrapperClassName: wrapperClassName,
    team3ContainerClassName: containerClassName,
  } = data || {};

  const carouselBreakpoints = {
    0: {slidesPerView: 1},
    768: {slidesPerView: 2},
    992: {slidesPerView: 3},
    1200: {slidesPerView: 4},
  };

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row mb-3">
          <div className="col-md-10 col-xl-9 col-xxl-7 mx-auto text-center">
            <h2 className="display-4 mb-3">{title}</h2>
          </div>
        </div>

        <div className="position-relative">
          <div
            className="shape rounded-circle bg-soft-yellow rellax w-16 h-16"
            style={{bottom: '0.5rem', right: '-1.7rem'}}
          />

          <div
            className="shape rounded-circle bg-line red rellax w-16 h-16"
            style={{top: '0.5rem', left: '-1.7rem'}}
          />

          <div className="swiper-container dots-closer mb-6">
            <Carousel
              grabCursor
              spaceBetween={spaceBetween}
              navigation={navigation}
              breakpoints={carouselBreakpoints}>
              {members?.map(({id, attrs: item}, i) => {
                const socialLinks = item.socialLinks?.map(socialLink => ({
                  id: socialLink.id,
                  icon: `uil uil-${socialLink.attrs.icon || ''}`,
                  url: socialLink.attrs.url || '#',
                }));
                return (
                  <div className="item-inner" key={id}>
                    <TeamCard1
                      name={item.name}
                      description={item.description}
                      designation={item.designation}
                      socialLinks={socialLinks || []}
                      image={getMetaFileURL({
                        metaFile: item.image,
                        path: `team3Members[${i}].attrs.image`,
                        ...props,
                      })}
                    />
                  </div>
                );
              })}
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
}
