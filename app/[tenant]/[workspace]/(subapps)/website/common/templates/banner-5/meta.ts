import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';

export const banner5Schema = {
  title: 'Banner 5',
  code: 'banner5',
  type: Template.block,
  fields: [
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
    },
    {
      name: 'video',
      title: 'Video',
      type: 'string',
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
      defaultValue: 'container py-14 py-md-16',
    },
  ],
  models: [],
} as const satisfies TemplateSchema;

export type Banner5Data = Data<typeof banner5Schema>;

export const banner5Demos: Demo<typeof banner5Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-23',
    sequence: 4,
    data: {
      banner5Heading:
        "I'd like to provide you with a one-of-a-kind video and photo package customized to your specific needs.",
      banner5Video: '409924928',
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-23',
    sequence: 4,
    data: {
      banner5Heading:
        'Je souhaite vous proposer un forfait vidéo et photo unique en son genre, adapté à vos besoins spécifiques.',
      banner5Video: '409924928',
    },
  },
];
