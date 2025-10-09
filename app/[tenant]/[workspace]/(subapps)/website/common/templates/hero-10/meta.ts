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
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-light',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue:
        'container pt-11 pt-md-13 pb-11 pb-md-19 pb-lg-22 text-center',
    },
  ],
  models: [],
} as const satisfies TemplateSchema;

export type Hero10Data = Data<typeof hero10Schema>;

export const hero10Demos: Demo<typeof hero10Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-10',
    sequence: 1,
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
    site: 'fr',
    page: 'demo-10',
    sequence: 1,
    data: {
      hero10Title: 'Nous proposons des idées pour rendre la vie meilleure.',
      hero10Description:
        'Nous sommes une organisation innovante qui valorise les relations permanentes avec ses clients.',
      hero10ButtonLabel: 'Lire la suite',
      hero10ButtonLink: '#',
    },
  },
];
