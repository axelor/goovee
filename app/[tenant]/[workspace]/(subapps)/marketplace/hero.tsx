'use client';

import {IMAGE_URL} from '@/constants';
import {i18n} from '@/lib/core/locale';
import {HeroSearch} from '@/ui/components';
import {BannerVariants} from '@/ui/components/banner';
import type {VariantProps} from 'class-variance-authority';
import Search from './search';

export const Hero = ({
  title,
  description,
  image,
  background,
}: {
  title: string | null;
  description: string | null;
  image: string | null;
  background: VariantProps<BannerVariants>['background'] | null;
}) => {
  const renderSearch = () => <Search />;
  return (
    <HeroSearch
      title={title || i18n.t('Marketplace')}
      description={
        description ||
        i18n.t('Discover and install apps and skills to extend your portal.')
      }
      background={background || 'default'}
      blendMode={background ? 'overlay' : 'normal'}
      image={image ?? IMAGE_URL}
      renderSearch={renderSearch}
    />
  );
};

export default Hero;
