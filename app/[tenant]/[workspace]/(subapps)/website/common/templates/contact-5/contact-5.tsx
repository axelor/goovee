import type {TemplateProps} from '@/subapps/website/common/types';
import {type Contact5Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {Tiles3} from '@/subapps/website/common/components/elements/tiles';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function Contact5(props: TemplateProps<Contact5Data>) {
  const {data} = props;
  const {
    contact5Title: title,
    contact5Description: description,
    contact5Caption: caption,
    contact5ButtonLabel: buttonLabel,
    contact5ButtonLink: buttonLink,
    contact5TileImage1,
    contact5TileImage2,
    contact5Heading: heading,
    contact5CountUp: countUp,
    contact5Suffix: suffix,
    contact5WrapperClassName: wrapperClassName,
    contact5ContainerClassName: containerClassName,
  } = data || {};

  const tileImage1 = getMetaFileURL({
    metaFile: contact5TileImage1,
    path: 'contact5TileImage1',
    ...props,
  });

  const tileImage2 = getMetaFileURL({
    metaFile: contact5TileImage2,
    path: 'contact5TileImage2',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gy-10 gx-lg-8 gx-xl-12 align-items-center">
          <div className="col-lg-7 position-relative">
            <Tiles3
              image1={tileImage1}
              image2={tileImage2}
              heading={heading}
              countUp={countUp}
              suffix={suffix}
            />
          </div>

          <div className="col-lg-5">
            <h2 className="display-4 mb-3">{title}</h2>
            <p className="lead fs-lg">{caption}</p>

            <p>{description}</p>

            <NextLink
              title={buttonLabel}
              href={buttonLink || '#'}
              className="btn btn-primary rounded mt-2"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
