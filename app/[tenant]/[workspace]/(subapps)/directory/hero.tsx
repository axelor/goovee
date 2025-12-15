'use client';
import type {ID} from '@goovee/orm';
import type {VariantProps} from 'class-variance-authority';

// ---- CORE IMPORTS ---- //
import {IMAGE_URL} from '@/constants';
import {i18n} from '@/lib/core/locale';
import {HeroSearch} from '@/ui/components';
import {BannerVariants} from '@/ui/components/banner';

// ---- LOCAL IMPORTS ---- //
import Search from './search';

export const Hero = ({
  title,
  description,
  image,
  background,
}: {
  projectId?: ID;
  title?: string;
  description?: string;
  image?: string;
  background?: VariantProps<BannerVariants>['background'];
}) => {
  const renderSearch = () => <Search />;
  return (
    <HeroSearch
      title={title || i18n.t('app-directory')}
      description={
        description ||
        i18n.t(
          'Mi eget leo viverra cras pharetra enim viverra. Ac at non pretium etiam viverra. Ac at non pretium etiam',
        )
      }
      background={background || 'default'}
      blendMode={background ? 'overlay' : 'normal'}
      image={image ?? IMAGE_URL}
      renderSearch={renderSearch}
    />
  );
};

export default Hero;
