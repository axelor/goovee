import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const portfolio9Schema = {
  title: 'Portfolio 9',
  code: 'portfolio9',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'linkTitle',
      title: 'Link Title',
      type: 'string',
    },
    {
      name: 'linkHref',
      title: 'Link Href',
      type: 'string',
    },
    {
      name: 'section1Caption',
      title: 'Section 1 Caption',
      type: 'string',
    },
    {
      name: 'section1Heading',
      title: 'Section 1 Heading',
      type: 'string',
    },
    {
      name: 'section1Description',
      title: 'Section 1 Description',
      type: 'string',
    },
    {
      name: 'section1LinkTitle',
      title: 'Section 1 Link Title',
      type: 'string',
    },
    {
      name: 'section1LinkHref',
      title: 'Section 1 Link Href',
      type: 'string',
    },
    {
      name: 'section2Caption',
      title: 'Section 2 Caption',
      type: 'string',
    },
    {
      name: 'section2Heading',
      title: 'Section 2 Heading',
      type: 'string',
    },
    {
      name: 'section2Description',
      title: 'Section 2 Description',
      type: 'string',
    },
    {
      name: 'section2LinkTitle',
      title: 'Section 2 Link Title',
      type: 'string',
    },
    {
      name: 'section2LinkHref',
      title: 'Section 2 Link Href',
      type: 'string',
    },
    {
      name: 'section3Caption',
      title: 'Section 3 Caption',
      type: 'string',
    },
    {
      name: 'section3Heading',
      title: 'Section 3 Heading',
      type: 'string',
    },
    {
      name: 'section3Description',
      title: 'Section 3 Description',
      type: 'string',
    },
    {
      name: 'section3LinkTitle',
      title: 'Section 3 Link Title',
      type: 'string',
    },
    {
      name: 'section3LinkHref',
      title: 'Section 3 Link Href',
      type: 'string',
    },
    {
      name: 'section4Caption',
      title: 'Section 4 Caption',
      type: 'string',
    },
    {
      name: 'section4Heading',
      title: 'Section 4 Heading',
      type: 'string',
    },
    {
      name: 'section4Description',
      title: 'Section 4 Description',
      type: 'string',
    },
    {
      name: 'section4LinkTitle',
      title: 'Section 4 Link Title',
      type: 'string',
    },
    {
      name: 'section4LinkHref',
      title: 'Section 4 Link Href',
      type: 'string',
    },
    {
      name: 'image1',
      title: 'Image 1',
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'image2',
      title: 'Image 2',
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'image3',
      title: 'Image 3',
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'image4',
      title: 'Image 4',
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-light wrapper-border',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-14 pt-md-18 pb-md-16',
    },
  ],
  models: [imageModel],
} as const satisfies TemplateSchema;

export type Portfolio9Data = Data<typeof portfolio9Schema>;

export const portfolio9Demos: Demo<typeof portfolio9Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-16',
    sequence: 3,
    data: {
      portfolio9Title: 'Latest Projects',
      portfolio9Description:
        'Check out some of my latest projects with creative ideas.',
      portfolio9LinkTitle: 'See All Projects',
      portfolio9LinkHref: '#',
      portfolio9Section1Caption: 'Software Development',
      portfolio9Section1Heading: 'Sandbox Real Estate',
      portfolio9Section1Description:
        'Software engineers offer services related to software development, web and mobile app development, DevOps, cloud computing, database management, software testing, maintenance.',
      portfolio9Section1LinkTitle: 'See Project',
      portfolio9Section1LinkHref: '#',
      portfolio9Section2Caption: 'Mobile Design',
      portfolio9Section2Heading: 'Budget App',
      portfolio9Section2Description:
        'Maecenas faucibus mollis interdum sed posuere consectetur est at lobortis. Scelerisque id ligula porta felis euismod semper. Fusce dapibus tellus cursus.',
      portfolio9Section2LinkTitle: 'See Project',
      portfolio9Section2LinkHref: '#',
      portfolio9Section3Caption: 'Web Design',
      portfolio9Section3Heading: 'Missio Theme',
      portfolio9Section3Description:
        'Maecenas faucibus mollis interdum sed posuere porta consectetur cursus porta lobortis. Scelerisque id ligula felis.',
      portfolio9Section3LinkTitle: 'See Project',
      portfolio9Section3LinkHref: '#',
      portfolio9Section4Caption: 'Mobile Design',
      portfolio9Section4Heading: 'Storage App',
      portfolio9Section4Description:
        'Maecenas faucibus mollis interdum sed posuere consectetur est at lobortis. Scelerisque id ligula porta felis euismod semper.',
      portfolio9Section4LinkTitle: 'See Project',
      portfolio9Section4LinkHref: '#',
      portfolio9Image1: {
        id: 'img-1',
        version: 0,
        attrs: {
          alt: 'Sandbox Real Estate',
          width: 1036,
          height: 578,
          image: {
            id: '1',
            version: 1,
            fileName: 'f1.png',
            fileType: 'image/png',
            filePath: '/img/photos/f1.png',
          },
        },
      },
      portfolio9Image2: {
        id: 'img-2',
        version: 0,
        attrs: {
          alt: 'Budget App',
          width: 524,
          height: 528,
          image: {
            id: '1',
            version: 1,
            fileName: 'f2.png',
            fileType: 'image/png',
            filePath: '/img/photos/f2.png',
          },
        },
      },
      portfolio9Image3: {
        id: 'img-3',
        version: 0,
        attrs: {
          alt: 'Missio Theme',
          width: 585,
          height: 350,
          image: {
            id: '1',
            version: 1,
            fileName: 'f3.png',
            fileType: 'image/png',
            filePath: '/img/photos/f3.png',
          },
        },
      },
      portfolio9Image4: {
        id: 'img-4',
        version: 0,
        attrs: {
          alt: 'Storage App',
          width: 585,
          height: 350,
          image: {
            id: '1',
            version: 1,
            fileName: 'f4.png',
            fileType: 'image/png',
            filePath: '/img/photos/f4.png',
          },
        },
      },
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-16',
    sequence: 3,
    data: {
      portfolio9Title: 'Derniers projets',
      portfolio9Description:
        'Découvrez quelques-uns de mes derniers projets avec des idées créatives.',
      portfolio9LinkTitle: 'Voir tous les projets',
      portfolio9LinkHref: '#',
      portfolio9Section1Caption: 'Développement de logiciels',
      portfolio9Section1Heading: 'Sandbox Real Estate',
      portfolio9Section1Description:
        'Les ingénieurs logiciels proposent des services liés au développement de logiciels, au développement d’applications Web et mobiles, au DevOps, au cloud computing, à la gestion de bases de données, aux tests de logiciels et à la maintenance.',
      portfolio9Section1LinkTitle: 'Voir le projet',
      portfolio9Section1LinkHref: '#',
      portfolio9Section2Caption: 'Conception mobile',
      portfolio9Section2Heading: 'Application de budget',
      portfolio9Section2Description:
        'Maecenas faucibus mollis interdum sed posuere consectetur est at lobortis. Scelerisque id ligula porta felis euismod semper. Fusce dapibus tellus cursus.',
      portfolio9Section2LinkTitle: 'Voir le projet',
      portfolio9Section2LinkHref: '#',
      portfolio9Section3Caption: 'Conception de sites Web',
      portfolio9Section3Heading: 'Thème Missio',
      portfolio9Section3Description:
        'Maecenas faucibus mollis interdum sed posuere porta consectetur cursus porta lobortis. Scelerisque id ligula felis.',
      portfolio9Section3LinkTitle: 'Voir le projet',
      portfolio9Section3LinkHref: '#',
      portfolio9Section4Caption: 'Conception mobile',
      portfolio9Section4Heading: 'Application de stockage',
      portfolio9Section4Description:
        'Maecenas faucibus mollis interdum sed posuere consectetur est at lobortis. Scelerisque id ligula porta felis euismod semper.',
      portfolio9Section4LinkTitle: 'Voir le projet',
      portfolio9Section4LinkHref: '#',
      portfolio9Image1: {
        id: 'img-1',
        version: 0,
        attrs: {
          alt: 'Sandbox Real Estate',
          width: 1036,
          height: 578,
          image: {
            id: '1',
            version: 1,
            fileName: 'f1.png',
            fileType: 'image/png',
            filePath: '/img/photos/f1.png',
          },
        },
      },
      portfolio9Image2: {
        id: 'img-2',
        version: 0,
        attrs: {
          alt: 'Application de budget',
          width: 524,
          height: 528,
          image: {
            id: '1',
            version: 1,
            fileName: 'f2.png',
            fileType: 'image/png',
            filePath: '/img/photos/f2.png',
          },
        },
      },
      portfolio9Image3: {
        id: 'img-3',
        version: 0,
        attrs: {
          alt: 'Thème Missio',
          width: 585,
          height: 350,
          image: {
            id: '1',
            version: 1,
            fileName: 'f3.png',
            fileType: 'image/png',
            filePath: '/img/photos/f3.png',
          },
        },
      },
      portfolio9Image4: {
        id: 'img-4',
        version: 0,
        attrs: {
          alt: 'Application de stockage',
          width: 585,
          height: 350,
          image: {
            id: '1',
            version: 1,
            fileName: 'f4.png',
            fileType: 'image/png',
            filePath: '/img/photos/f4.png',
          },
        },
      },
    },
  },
];
