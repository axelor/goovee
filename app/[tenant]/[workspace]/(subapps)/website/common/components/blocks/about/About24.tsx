import {FC} from 'react';
import {CountUp} from '@/subapps/website/common/components/reuseable/countup';
import {ProcessList2} from '@/subapps/website/common/components/reuseable/process-list';
// -------- data -------- //
import {skill2} from '@/subapps/website/common/data/skill';
import {factList10} from '@/subapps/website/common/data/facts';
import {processList} from '@/subapps/website/common/data/demo-12';

const list = [
  'One effective way to detail your skills.',
  'Nullam quis risus eget urna mollis.',
  'Donec id elit non mi porta gravida.',
  'One effective way to detail your skills.',
  'Cras justo odio dapibus ac facilisis in.',
];

const About24: FC = () => {
  return (
    <section className="wrapper bg-light">
      <div className="container pt-12 pt-md-14 pb-14 pb-md-16">
        <div className="row gx-md-8 gx-xl-12 gy-6 align-items-center">
          <div className="col-md-8 col-lg-6 mx-auto">
            <div className="img-mask mask-1">
              <img
                src="/img/photos/about29.jpg"
                srcSet="/img/photos/about29@2x.jpg 2x"
                alt=""
              />
            </div>
          </div>

          <div className="col-lg-6">
            <h2 className="display-5 mb-5">
              Hi, I&apos;m Jhon, and I&apos;m a film bridal and individual
              photography located in United Kingdom.
            </h2>
            <p className="mb-6">
              I’m a professional photographer with a passion for capturing
              life&apos;s fleeting moments. With over 4+ years of experience in
              the field, I developed a keen eye for detail and a unique
              perspective that shines through in every photograph of my art.
            </p>

            <div className="row counter-wrapper gy-6">
              {factList10.map(({id, title, value, suffix}) => (
                <div className="col-md-4" key={id}>
                  <h3 className="counter">
                    <CountUp end={value} suffix={suffix} />
                  </h3>
                  <p>{title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="row gx-md-8 gx-xl-12 gy-6 mt-8">
          <div className="col-lg-4">
            <h3>My Skills</h3>
            <p>
              I am a skilled photographer with a keen eye for detail & a unique
              perspective. I have experience using professional camera
              equipment.
            </p>

            <ul className="progress-list">
              {skill2.map(({id, title, value}) => (
                <li key={id}>
                  <p>{title}</p>
                  <div
                    className="progressbar line primary"
                    data-value={value}
                  />
                </li>
              ))}
            </ul>
          </div>

          <div className="col-lg-4">
            <h3>Why Choose Me?</h3>
            <p>
              I’m a professional photographer with a passion for capturing
              life&apos;s fleeting moments. With over 4+ years of experience in
              the field, I developed a keen eye for detail and a unique
              perspective that shines through in every photograph.
            </p>

            <ul className="icon-list bullet-bg bullet-soft-primary">
              {list.map(item => (
                <li key={item}>
                  <i className="uil uil-check" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="col-lg-4">
            <h3>My Process</h3>

            {processList.map(item => (
              <ProcessList2
                {...item}
                key={item.no}
                className="icon btn btn-circle btn-soft-primary pe-none mt-1 me-5"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About24;
