'use client';

// ---- CORE IMPORTS ---- //
import {Banner} from '@/ui/components';
import {VariantProps} from 'class-variance-authority';
import {BannerVariants} from '../banner';

type HearoSerchTypes = {
  groupImg?: string;
  title: string;
  description?: string;
  image: any;
  renderSearch?: any;
  className?: string;
} & VariantProps<BannerVariants>;

export const HeroSearch = ({
  groupImg,
  title = '',
  description = '',
  image,
  renderSearch,
  background,
  blendMode,
  className,
}: HearoSerchTypes) => {
  return (
    <>
      <Banner
        groupImg={groupImg}
        title={title}
        description={description}
        image={image}
        renderSearch={renderSearch}
        background={background}
        blendMode={blendMode}
        className={className}
      />
    </>
  );
};

export default HeroSearch;
