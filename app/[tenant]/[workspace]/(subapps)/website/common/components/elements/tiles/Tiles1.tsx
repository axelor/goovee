import Image from 'next/image';
import {ImageType} from '../../../types/templates';

function Tiles1({
  image1,
  image2,
  image3,
}: {
  image1: ImageType;
  image2: ImageType;
  image3: ImageType;
}) {
  return (
    <div className="row gx-md-5 gy-5 align-items-center">
      <div className="col-md-6">
        <div className="row gx-md-5 gy-5">
          <div className="col-md-10 offset-md-2">
            <figure className="rounded">
              {image1.url && (
                <Image
                  src={image1.url}
                  alt={image1.alt}
                  width={image1.width}
                  height={image1.height}
                />
              )}
            </figure>
          </div>

          <div className="col-md-12">
            <figure className="rounded">
              {image2.url && (
                <Image
                  src={image2.url}
                  alt={image2.alt}
                  width={image2.width}
                  height={image2.height}
                />
              )}
            </figure>
          </div>
        </div>
      </div>

      <div className="col-md-6">
        <figure className="rounded">
          {image3.url && (
            <Image
              src={image3.url}
              alt={image3.alt}
              width={image3.width}
              height={image3.height}
            />
          )}
        </figure>
      </div>
    </div>
  );
}

export default Tiles1;
