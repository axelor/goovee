import Image from 'next/image';
import {ImageType} from '@/subapps/website/common/types/templates';

function Tiles5(props: {images: ImageType[]}) {
  const {images} = props;

  return (
    <>
      <div
        className="shape bg-dot primary rellax w-16 h-20"
        style={{top: '3rem', left: '5.5rem'}}
      />

      <div className="overlap-grid overlap-grid-2">
        {images
          .filter(image => image.url)
          .map((item, i) => (
            <div className="item" key={item.url + i}>
              <figure className="rounded shadow">
                <Image
                  src={item.url}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                />
              </figure>
            </div>
          ))}
      </div>
    </>
  );
}

export default Tiles5;
