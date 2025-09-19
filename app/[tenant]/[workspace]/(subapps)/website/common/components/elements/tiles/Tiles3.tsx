import {CountUp} from '@/subapps/website/common/components/reuseable/countup';

function Tiles3(props: {
  image1?: string;
  image2?: string;
  heading?: string;
  countUp?: number;
  suffix?: string;
}) {
  const {image1, image2, heading, countUp = 0, suffix} = props;
  return (
    <div className="row gx-md-5 gy-5">
      <div className="col-md-6">
        <figure className="rounded mt-md-10 position-relative">
          <img src={image1} alt="" />
        </figure>
      </div>

      <div className="col-md-6">
        <div className="row gx-md-5 gy-5">
          <div className="col-md-12 order-md-2">
            <figure className="rounded">
              <img src={image2} alt="" />
            </figure>
          </div>

          <div className="col-md-10">
            <div className="card bg-pale-primary text-center">
              <div className="card-body py-11 counter-wrapper">
                <h3 className="counter text-nowrap">
                  <CountUp end={countUp} suffix={suffix} separator="" />
                </h3>

                <p className="mb-0">{heading}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tiles3;
