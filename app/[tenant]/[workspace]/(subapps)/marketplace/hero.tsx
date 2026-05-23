'use client';
import type {VariantProps} from 'class-variance-authority';

import {IMAGE_URL} from '@/constants';
import {i18n} from '@/lib/core/locale';
import {HeroSearch} from '@/ui/components';
import {BannerVariants} from '@/ui/components/banner';

import Search from './search';
import {MARKETPLACE_TYPE} from './common/constants/marketplace-types';

export const Hero = ({
  title,
  description,
  image,
  background,
  type,
}: {
  title: string | null;
  description: string | null;
  image: string | null;
  background: VariantProps<BannerVariants>['background'] | null;
  type?: MARKETPLACE_TYPE;
}) => {
  const renderSearch = () => <Search type={type} />;
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
