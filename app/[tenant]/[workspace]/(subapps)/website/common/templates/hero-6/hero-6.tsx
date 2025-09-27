import type {TemplateProps} from '@/subapps/website/common/types';
import {type Hero6Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {
  fadeInAnimate,
  slideInDownAnimate,
} from '@/subapps/website/common/utils/animation';
import GoogleAppBtn from '@/subapps/website/common/components/common/GoogleAppBtn';

export function Hero6(props: TemplateProps<Hero6Data>) {
  const {data} = props;
  const {
    hero6Title: title,
    hero6Description: description,
    hero6AppStoreTitle: appStoreTitle,
    hero6AppStoreUrl: appStoreUrl,
    hero6GooglePlayTitle: googlePlayTitle,
    hero6GooglePlayUrl: googlePlayUrl,
    hero6Image,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: hero6Image,
    path: 'hero6Image',
    ...props,
  });

  return (
    <section className="wrapper bg-soft-primary">
      <div className="container py-10 ">
        <div className="row align-items-center">
          <div className="col-lg-6 col-md-6 offset-md-3 offset-lg-0">
            <img
              alt="hero"
              src={image}
              style={{...fadeInAnimate('0ms')}}
              className="img-fluid"
            />
          </div>

          <div className="col-lg-5 text-center text-lg-start mt-md-10 mt-lg-0">
            <h1
              className="display-3 mb-4 mx-sm-n2 mx-md-0"
              style={slideInDownAnimate('600ms')}>
              {title}
            </h1>

            <p
              className="lead fs-lg mb-7 px-md-10 px-lg-0"
              style={slideInDownAnimate('900ms')}>
              {description}
            </p>

            <GoogleAppBtn
              appStoreTitle={appStoreTitle}
              appStoreUrl={appStoreUrl}
              googlePlayTitle={googlePlayTitle}
              googlePlayUrl={googlePlayUrl}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
