import Image from 'next/image';
import {ImageType} from '@/subapps/website/common/types/templates';

function Tiles11(props: {
  image1?: ImageType;
  image2?: ImageType;
  image3?: ImageType;
}) {
  const {image1, image2, image3} = props;
  return (
    <div className="row gx-md-5 gy-5">
      <div className="col-md-6">
        <figure className="rounded">
          {image1 && (
            <Image
              src={image1.url}
              alt={image1.alt}
              width={image1.width}
              height={image1.height}
            />
          )}
        </figure>
      </div>

      <div className="col-md-6 align-self-end">
        <figure className="rounded">
          {image2 && (
            <Image
              src={image2.url}
              alt={image2.alt}
              width={image2.width}
              height={image2.height}
            />
          )}
        </figure>
      </div>

      <div className="col-12">
        <figure className="rounded mx-md-5">
          {image3 && (
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

export default Tiles11;
