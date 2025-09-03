import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';

export const hero10Schema = {
  title: 'Hero 10',
  code: 'hero10',
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
      name: 'buttonLabel',
      title: 'Button Label',
      type: 'string',
    },
    {
      name: 'buttonLink',
      title: 'Button Link',
      type: 'string',
    },
  ],
  models: [],
} as const satisfies TemplateSchema;

export type Hero10Data = Data<typeof hero10Schema>;

export const hero10Demos: Demo<typeof hero10Schema>[] = [
  {
    language: 'en_US',
    data: {
      hero10Title: 'We provide ideas for making lives better.',
      hero10Description:
        'We offer an innovative organization that values permanent relations with clients.',
      hero10ButtonLabel: 'Read More',
      hero10ButtonLink: '#',
    },
  },
  {
    language: 'fr_FR',
    data: {
      hero10Title: 'Nous proposons des idées pour rendre la vie meilleure.',
      hero10Description:
        'Nous sommes une organisation innovante qui valorise les relations permanentes avec ses clients.',
      hero10ButtonLabel: 'Lire la suite',
      hero10ButtonLink: '#',
    },
  },
];
