import type {TemplateProps} from '@/subapps/website/common/types';
import {type Team2Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';
import carouselBreakpoints from '@/subapps/website/common/utils/carouselBreakpoints';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import {TeamCard2} from '@/subapps/website/common/components/reuseable/team-cards';

export function Team2(props: TemplateProps<Team2Data>) {
  const {data} = props;
  const {
    team2Caption: caption,
    team2Title: title,
    team2Para: para,
    team2Navigation: navigation,
    team2ButtonLabel: buttonLabel,
    team2ButtonLink: buttonLink,
    team2Members: members = [],
    team2WrapperClassName: wrapperClassName,
    team2ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 align-items-center">
          <div className="col-lg-4">
            <h2 className="fs-15 text-uppercase text-muted mb-3">{caption}</h2>
            <h3 className="display-6 mb-5">{title}</h3>
            <p className="fs-15">{para}</p>

            <NextLink
              href={buttonLink}
              title={buttonLabel}
              className="btn btn-primary rounded-pill mt-3"
            />
          </div>

          <div className="col-lg-8">
            <div className="swiper-container text-center mb-6">
              <Carousel
                grabCursor
                navigation={navigation}
                breakpoints={carouselBreakpoints}>
                {members?.map(({id, attrs: item}, i) => {
                  const socialLinks = item.socialLinks?.map(socialLink => ({
                    id: socialLink.id,
                    icon: `uil uil-${socialLink.attrs.icon || ''}`,
                    url: socialLink.attrs.url || '#',
                  }));
                  return (
                    <TeamCard2
                      key={id}
                      name={item.name}
                      description={item.description}
                      designation={item.designation}
                      socialLinks={socialLinks || []}
                      image={getMetaFileURL({
                        metaFile: item.image,
                        path: `team2Members[${i}].attrs.image`,
                        ...props,
                      })}
                    />
                  );
                })}
              </Carousel>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
