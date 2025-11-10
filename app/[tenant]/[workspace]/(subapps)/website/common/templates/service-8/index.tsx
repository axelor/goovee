import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service8Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import IconBox from '@/subapps/website/common/components/reuseable/IconBox';
import ServiceCard3 from '@/subapps/website/common/components/reuseable/service-cards/ServiceCard3';
import {fadeInAnimate} from '../../utils/animation';
import Image from 'next/image';

export default function Service8(props: TemplateProps<Service8Data>) {
  const {data} = props;
  const {
    service8Title: title,
    service8Description: description,
    service8TileImage1,
    service8TileImage2,
    service8TileImage3,
    service8TileImage4,
    service8Services: services,
    service8WrapperClassName: wrapperClassName,
    service8ContainerClassName: containerClassName,
  } = data || {};

  const tileImage1 = getImage({
    image: service8TileImage1,
    path: 'service8TileImage1',
    ...props,
  });

  const tileImage2 = getImage({
    image: service8TileImage2,
    path: 'service8TileImage2',
    ...props,
  });

  const tileImage3 = getImage({
    image: service8TileImage3,
    path: 'service8TileImage3',
    ...props,
  });

  const tileImage4 = getImage({
    image: service8TileImage4,
    path: 'service8TileImage4',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gy-8 align-items-center">
          <div className="col-lg-6 position-relative order-lg-2">
            <div className="row gx-md-5 gy-5 position-relative">
              <div className="col-5">
                <Image
                  alt={tileImage1.alt}
                  src={tileImage1.url}
                  width={tileImage1.width}
                  height={tileImage1.height}
                  className="img-fluid rounded shadow-lg my-5 d-flex ms-auto"
                  style={fadeInAnimate('300ms')}
                />
                <Image
                  alt={tileImage2.alt}
                  src={tileImage2.url}
                  width={tileImage2.width}
                  height={tileImage2.height}
                  className="img-fluid rounded shadow-lg d-flex col-10 ms-auto"
                  style={fadeInAnimate('600ms')}
                />
              </div>

              <div className="col-7">
                <Image
                  alt={tileImage3.alt}
                  src={tileImage3.url}
                  width={tileImage3.width}
                  height={tileImage3.height}
                  className="img-fluid rounded shadow-lg mb-5"
                  style={fadeInAnimate('900ms')}
                />
                <Image
                  alt={tileImage4.alt}
                  src={tileImage4.url}
                  width={tileImage4.width}
                  height={tileImage4.height}
                  style={fadeInAnimate('1200ms')}
                />
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <h2 className="display-4 mb-3">{title}</h2>
            <p className="lead fs-lg mb-8 pe-xxl-2">{description}</p>

            <div className="row gx-xl-10 gy-6">
              {services?.map(({id, attrs: item}) => (
                <div className="col-md-6 col-lg-12 col-xl-6" key={id}>
                  <ServiceCard3
                    title={item.title}
                    description={item.description}
                    Icon={
                      <IconBox
                        icon={`uil-${item.icon}`}
                        className="icon btn btn-circle btn-lg btn-soft-primary pe-none me-5"
                      />
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
