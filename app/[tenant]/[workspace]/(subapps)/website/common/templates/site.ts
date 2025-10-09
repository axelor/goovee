import type {Language, Site} from '../types/templates';

export type Website = {
  name: string;
  sites: {
    language: Language;
    website: {
      name: string;
      slug: Site;
      isGuestUserAllow: boolean;
      homepage: string;
      isDefault?: true;
    };
  }[];
};

export const website = {
  name: 'Lighthouse',
  sites: [
    {
      language: 'en_US',
      website: {
        name: 'English',
        slug: 'en',
        isGuestUserAllow: true,
        homepage: 'demo-1',
        isDefault: true,
      },
    },
    {
      language: 'fr_FR',
      website: {
        name: 'Français',
        slug: 'fr',
        isGuestUserAllow: true,
        homepage: 'demo-1',
      },
    },
  ],
} satisfies Website;
