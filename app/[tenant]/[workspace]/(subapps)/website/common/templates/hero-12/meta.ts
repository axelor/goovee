import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const hero12Schema = {
  title: 'Hero 12',
  code: 'hero12',
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
      name: 'buttonLabel1',
      title: 'Button Label 1',
      type: 'string',
    },
    {
      name: 'buttonLabel2',
      title: 'Button Label 2',
      type: 'string',
    },
    {
      name: 'buttonLink1',
      title: 'Button Link 1',
      type: 'string',
    },
    {
      name: 'buttonLink2',
      title: 'Button Link 2',
      type: 'string',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-soft-primary',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-10 pb-15 pt-md-14 pb-md-20',
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Hero12Data = Data<typeof hero12Schema>;

export const hero12Demos: Demo<typeof hero12Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-12',
    sequence: 1,
    data: {
      hero12Title: 'Inventive, Sharp, Magnificent.',
      hero12Description:
        'We are a digital and mobile creative company with many honors, as we truly trust in the value.',
      hero12ButtonLabel1: 'See Projects',
      hero12ButtonLabel2: 'Learn More',
      hero12ButtonLink1: '#',
      hero12ButtonLink2: '#',
      hero12Image: {
        id: '1',
        version: 1,
        fileName: 'i6.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i6.png',
      },
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-12',
    sequence: 1,
    data: {
      hero12Title: 'Inventif, pointu, magnifique.',
      hero12Description:
        'Nous sommes une entreprise de création numérique et mobile avec de nombreuses distinctions, car nous croyons vraiment en la valeur.',
      hero12ButtonLabel1: 'Voir les projets',
      hero12ButtonLabel2: 'En savoir plus',
      hero12ButtonLink1: '#',
      hero12ButtonLink2: '#',
      hero12Image: {
        id: '1',
        version: 1,
        fileName: 'i6.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i6.png',
      },
    },
  },
];
