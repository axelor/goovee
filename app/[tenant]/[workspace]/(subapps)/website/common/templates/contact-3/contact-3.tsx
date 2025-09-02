import type {TemplateProps} from '@/subapps/website/common/types';
import {type Contact3Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {Tiles3} from '@/subapps/website/common/components/elements/tiles';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function Contact3(props: TemplateProps<Contact3Data>) {
  const {data} = props;
  const {
    contact3Title: title,
    contact3Description1: description1,
    contact3Description2: description2,
    contact3LinkTitle: linkTitle,
    contact3LinkHref: linkHref,
    contact3TileImage1,
    contact3TileImage2,
    contact3Heading: heading,
    contact3CountUp: countUp,
    contact3Suffix: suffix,
  } = data || {};

  const tileImage1 = getMetaFileURL({
    metaFile: contact3TileImage1,
    path: 'contact3TileImage1',
    ...props,
  });

  const tileImage2 = getMetaFileURL({
    metaFile: contact3TileImage2,
    path: 'contact3TileImage2',
    ...props,
  });

  return (
    <div className="container">
      <div className="row gy-10 gx-lg-8 gx-xl-12 align-items-center">
        <div className="col-lg-7 position-relative">
          <div
            className="shape bg-dot primary rellax w-18 h-18"
            style={{top: 0, left: '-1.4rem', zIndex: 0}}
          />

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
          <p className="lead fs-lg">{description1}</p>

          <p>{description2}</p>

          <NextLink
            title={linkTitle}
            href={linkHref}
            className="btn btn-primary rounded-pill mt-2"
          />
        </div>
      </div>
    </div>
  );
}
