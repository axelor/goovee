import type {TemplateProps} from '@/subapps/website/common/types';
import {type Faq1Data} from './meta';
import Accordion from '@/subapps/website/common/components/reuseable/accordion';
import {Fragment} from 'react';
import {getImage, getMetaFileURL, getTemplateId} from '../../utils/helper';
import Image from 'next/image';

export function FAQ1(props: TemplateProps<Faq1Data>) {
  const {data} = props;
  const {
    faq1Title: title,
    faq1Caption: caption,
    faq1Questions: questions,
    faq1WrapperClassName: wrapperClassName,
    faq1ContainerClassName: containerClassName,
    faq1Media,
    faq1Thumbnail,
  } = data || {};

  const half = Math.ceil((questions?.length ?? 0) / 2);
  const questions1 = questions?.slice(0, half);
  const questions2 = questions?.slice(half);

  const uniqueId = getTemplateId(props);

  const media = getMetaFileURL({
    metaFile: faq1Media,
    path: 'faq1Media',
    ...props,
  });

  const thumbnail = getImage({
    image: faq1Thumbnail,
    path: 'faq1Thumbnail',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row">
          <div className="col-xl-10 mx-auto">
            <div className="mt-lg-n20 mt-xl-n22 mb-14 mb-md-16 position-relative">
              <a
                data-glightbox
                data-type="video"
                href={media}
                className="btn btn-circle btn-primary btn-play ripple mx-auto mb-5 position-absolute"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%,-50%)',
                  zIndex: 3,
                }}>
                <i className="icn-caret-right" />
              </a>
              <figure className="rounded shadow">
                <Image
                  src={thumbnail.url}
                  alt={thumbnail.alt}
                  width={thumbnail.width}
                  height={thumbnail.height}
                />
              </figure>
            </div>
            <h2 className="fs-15 text-uppercase text-muted mb-3 text-center">
              {caption}
            </h2>
            <h3 className="display-4 mb-10 px-lg-12 text-center">{title}</h3>

            <div className="accordion-wrapper" id={uniqueId}>
              <div className="row">
                <div className="col-md-6">
                  {questions1?.map(({id, attrs: item}) => (
                    <Accordion
                      key={id}
                      no={id}
                      expand={item.expand}
                      heading={item.heading}
                      body={item.body}
                      parentId={uniqueId}
                    />
                  ))}
                </div>
                <div className="col-md-6">
                  {questions2?.map(({id, attrs: item}) => (
                    <Accordion
                      key={id}
                      no={id}
                      expand={item.expand}
                      heading={item.heading}
                      body={item.body}
                      parentId={uniqueId}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
