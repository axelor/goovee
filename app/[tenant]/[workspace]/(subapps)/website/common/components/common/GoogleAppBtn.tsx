import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import {slideInDownAnimate} from '@/subapps/website/common/utils/animation';
import {Fragment} from 'react';

function GoogleAppBtn(props: {
  appStoreUrl?: string;
  googlePlayUrl?: string;
  appStoreTitle?: string;
  googlePlayTitle?: string;
}) {
  const {appStoreUrl, googlePlayUrl, appStoreTitle, googlePlayTitle} = props;
  return (
    <div
      className="d-flex justify-content-center justify-content-lg-start"
      style={slideInDownAnimate('900ms')}>
      <span style={slideInDownAnimate('1200ms')}>
        <NextLink
          href={appStoreUrl}
          className="btn btn-primary btn-icon btn-icon-start rounded me-2"
          title={
            <Fragment>
              <i className="uil uil-apple" /> {appStoreTitle ?? 'App Store'}
            </Fragment>
          }
        />
      </span>

      <span style={slideInDownAnimate('1500ms')}>
        <NextLink
          href={googlePlayUrl}
          className="btn btn-green btn-icon btn-icon-start rounded"
          title={
            <Fragment>
              <i className="uil uil-google-play" />{' '}
              {googlePlayTitle ?? 'Google Play'}
            </Fragment>
          }
        />
      </span>
    </div>
  );
}

export default GoogleAppBtn;
