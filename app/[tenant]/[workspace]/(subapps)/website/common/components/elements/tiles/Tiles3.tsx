import {CountUp} from '@/subapps/website/common/components/reuseable/countup';
import Image from 'next/image';
import {ImageType} from '../../../types/templates';

function Tiles3(props: {
  image1?: ImageType;
  image2?: ImageType;
  heading?: string;
  countUp?: number;
  suffix?: string;
}) {
  const {image1, image2, heading, countUp = 0, suffix} = props;
  return (
    <div className="row gx-md-5 gy-5">
      <div className="col-md-6">
        <figure className="rounded mt-md-10 position-relative">
          {image1?.url && (
            <Image
              src={image1.url}
              alt={image1.alt}
              width={image1.width}
              height={image1.height}
            />
          )}
        </figure>
      </div>

      <div className="col-md-6">
        <div className="row gx-md-5 gy-5">
          <div className="col-md-12 order-md-2">
            <figure className="rounded">
              {image2?.url && (
                <Image
                  src={image2.url}
                  alt={image2.alt}
                  width={image2.width}
                  height={image2.height}
                />
              )}
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
