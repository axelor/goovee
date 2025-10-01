import type {TemplateProps} from '@/subapps/website/common/types';
import {type Contact8Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {Tiles3} from '@/subapps/website/common/components/elements/tiles';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function Contact8(props: TemplateProps<Contact8Data>) {
  const {data} = props;
  const {
    contact8Title: title,
    contact8Description: description,
    contact8Caption: caption,
    contact8LinkTitle: linkTitle,
    contact8LinkHref: linkHref,
    contact8TileImage1,
    contact8TileImage2,
    contact8Heading: heading,
    contact8CountUp: countUp,
    contact8Suffix: suffix,
    contact8WrapperClassName: wrapperClassName,
    contact8ContainerClassName: containerClassName,
  } = data || {};

  const tileImage1 = getMetaFileURL({
    metaFile: contact8TileImage1,
    path: 'contact8TileImage1',
    ...props,
  });

  const tileImage2 = getMetaFileURL({
    metaFile: contact8TileImage2,
    path: 'contact8TileImage2',
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
              title={linkTitle}
              href={linkHref}
              className="btn btn-primary rounded-pill mt-2"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
