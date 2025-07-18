import {FC} from 'react';
import useReplaceMe from '@/subapps/website/common/hooks/useReplaceMe';

const Hero20: FC = () => {
  // enable the text rotator animation
  useReplaceMe();

  return (
    <section className="video-wrapper bg-overlay bg-overlay-gradient px-0 mt-0 min-vh-80">
      <video
        loop
        muted
        autoPlay
        playsInline
        // __idm_id__="1187841"
        id="1187841"
        src="/media/movie2.mp4"
        poster="/img/photos/movie2.jpg"
      />

      <div className="video-content">
        <div className="container text-center">
          <div className="row">
            <div className="col-lg-8 col-xl-6 text-center text-white mx-auto">
              <h1 className="display-1 fs-54 text-white mb-5">
                <span className="rotator-zoom">
                  Swift Responses,Creative Thinking,Top-Notch Support
                </span>
              </h1>

              <p className="lead fs-24 mb-0">
                Our area of expertise lies in digital services such as web
                design, mobile app development, and SEO optimization.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero20;
