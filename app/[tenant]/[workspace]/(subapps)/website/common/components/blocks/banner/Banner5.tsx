import {FC} from 'react';
import dynamic from 'next/dynamic';
const Plyr = dynamic(() => import('plyr-react'), {ssr: false});

const Banner5: FC = () => {
  return (
    <section className="wrapper bg-soft-primary">
      <div className="container py-14 py-md-16">
        <div className="row">
          <div className="col-xl-9 col-xxl-7 mx-auto text-center">
            <i className="icn-flower text-leaf fs-30 opacity-25"></i>
            <h2 className="display-5 text-center mt-2 mb-10">
              I&apos;d like to provide you with a one-of-a-kind video and photo
              package customized to your specific needs.
            </h2>
          </div>
        </div>

        <div className="row text-center">
          <div className="col-xl-9 mx-auto">
            <Plyr
              options={{loadSprite: true, clickToPlay: true}}
              source={{
                type: 'video',
                sources: [{src: '409924928', provider: 'vimeo'}],
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner5;
