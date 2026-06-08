'use client';
import type {ID} from '@/types';
import type {VariantProps} from 'class-variance-authority';

// ---- CORE IMPORTS ---- //
import {IMAGE_URL} from '@/constants';
import {withBasePath} from '@/lib/core/path/base-path';
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
  title?: string | null;
  description?: string | null;
  image?: string | null;
  background?: VariantProps<BannerVariants>['background'] | null;
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
      image={image ?? withBasePath(IMAGE_URL)}
      renderSearch={renderSearch}
    />
  );
};

export default Hero;
