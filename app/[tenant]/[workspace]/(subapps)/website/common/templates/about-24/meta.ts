import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const about24Schema = {
  title: 'About 24',
  code: 'about24',
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
      name: 'image',
      title: 'Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'heading1',
      title: 'Heading 1',
      type: 'string',
    },
    {
      name: 'description1',
      title: 'Description 1',
      type: 'string',
    },
    {
      name: 'heading2',
      title: 'Heading 2',
      type: 'string',
    },
    {
      name: 'heading3',
      title: 'Heading 3',
      type: 'string',
    },
    {
      name: 'description2',
      title: 'Description 2',
      type: 'string',
    },
    {
      name: 'factList',
      title: 'Fact List',
      type: 'json-one-to-many',
      target: 'About24FactList',
    },
    {
      name: 'skillList',
      title: 'Skill List',
      type: 'json-one-to-many',
      target: 'About24SkillList',
    },
    {
      name: 'list',
      title: 'List',
      type: 'json-one-to-many',
      target: 'About24List',
    },
    {
      name: 'processList',
      title: 'Process List',
      type: 'json-one-to-many',
      target: 'About24ProcessList',
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
      defaultValue: 'container pt-12 pt-md-14 pb-14 pb-md-16',
    },
  ],
  models: [
    {
      name: 'About24FactList',
      title: 'Fact List',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'value',
          title: 'Value',
          type: 'integer',
        },
        {
          name: 'suffix',
          title: 'Suffix',
          type: 'string',
        },
      ],
    },
    {
      name: 'About24SkillList',
      title: 'Skill List',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'value',
          title: 'Value',
          type: 'integer',
        },
      ],
    },
    {
      name: 'About24List',
      title: 'List',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
      ],
    },
    {
      name: 'About24ProcessList',
      title: 'Process List',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'subtitle',
          title: 'Subtitle',
          type: 'string',
        },
        {
          name: 'className',
          title: 'Class Name',
          type: 'string',
        },
      ],
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type About24Data = Data<typeof about24Schema>;

export const about24Demos: Demo<typeof about24Schema>[] = [
  {
    language: 'en_US',
    data: {
      about24Image: {
        id: '1',
        version: 1,
        fileName: 'about29.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about29.jpg',
      },
      about24Title:
        "Hi, I'm Jhon, and I'm a film bridal and individual photography located in United Kingdom.",
      about24Description:
        "I’m a professional photographer with a passion for capturing life's fleeting moments. With over 4+ years of experience in the field, I developed a keen eye for detail and a unique perspective that shines through in every photograph of my art.",
      about24Heading1: 'My Skills',
      about24Description1:
        'I am a skilled photographer with a keen eye for detail & a unique perspective. I have experience using professional camera equipment.',
      about24Heading2: 'Why Choose Me?',
      about24Description2:
        "I’m a professional photographer with a passion for capturing life's fleeting moments. With over 4+ years of experience in the field, I developed a keen eye for detail and a unique perspective that shines through in every photograph.",
      about24Heading3: 'My Process',
      about24FactList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Shots Taken',
            value: 100,
            suffix: 'K+',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Happy Clients',
            value: 15,
            suffix: 'K+',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Awards Won',
            value: 75,
            suffix: '',
          },
        },
      ],
      about24SkillList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Photoshop',
            value: 100,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Lightroom',
            value: 80,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Premiere Pro',
            value: 85,
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: '#D',
            value: 75,
          },
        },
      ],
      about24List: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'One effective way to detail your skills.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Nullam quis risus eget urna mollis.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Donec id elit non mi porta gravida.',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'One effective way to detail your skills.',
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            title: 'Cras justo odio dapibus ac facilisis in.',
          },
        },
      ],
      about24ProcessList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Personalized service',
            subtitle:
              'We believe in getting to know our customers and understanding their unique.',
            className: 'me-lg-6',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Competitive pricing',
            subtitle:
              'We believe in getting to know our customers and understanding their unique.',
            className: 'ms-lg-13 mt-6',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Timely delivery',
            subtitle:
              'We believe in getting to know our customers and understanding their unique.',
            className: 'mx-lg-6 mt-6',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      about24Image: {
        id: '1',
        version: 1,
        fileName: 'about29.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about29.jpg',
      },
      about24Title:
        "Bonjour, je m'appelle Jhon et je suis une photographie de mariage et individuelle située au Royaume-Uni.",
      about24Description:
        "Je suis un photographe professionnel passionné par la capture des moments éphémères de la vie. Avec plus de 4 ans d'expérience dans le domaine, j'ai développé un sens aigu du détail et une perspective unique qui transparaît dans chaque photographie de mon art.",
      about24Heading1: 'Mes compétences',
      about24Description1:
        'Je suis un photographe qualifié avec un sens aigu du détail et une perspective unique. J’ai de l’expérience dans l’utilisation de matériel photo professionnel.',
      about24Heading2: 'Pourquoi me choisir ?',
      about24Description2:
        "Je suis un photographe professionnel passionné par la capture des moments éphémères de la vie. Avec plus de 4 ans d'expérience dans le domaine, j'ai développé un sens aigu du détail et une perspective unique qui transparaît dans chaque photographie.",
      about24Heading3: 'Mon processus',
      about24FactList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Photos prises',
            value: 100,
            suffix: 'K+',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Clients heureux',
            value: 15,
            suffix: 'K+',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Récompenses gagnées',
            value: 75,
            suffix: '',
          },
        },
      ],
      about24SkillList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Photoshop',
            value: 100,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Lightroom',
            value: 80,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Premiere Pro',
            value: 85,
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: '#D',
            value: 75,
          },
        },
      ],
      about24List: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Un moyen efficace de détailler vos compétences.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Nullam quis risus eget urna mollis.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Donec id elit non mi porta gravida.',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Un moyen efficace de détailler vos compétences.',
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            title: 'Cras justo odio dapibus ac facilisis in.',
          },
        },
      ],
      about24ProcessList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Service personnalisé',
            subtitle:
              'Nous croyons qu’il est important de connaître nos clients et de comprendre leur caractère unique.',
            className: 'me-lg-6',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Prix compétitifs',
            subtitle:
              'Nous croyons qu’il est important de connaître nos clients et de comprendre leur caractère unique.',
            className: 'ms-lg-13 mt-6',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Livraison à temps',
            subtitle:
              'Nous croyons qu’il est important de connaître nos clients et de comprendre leur caractère unique.',
            className: 'mx-lg-6 mt-6',
          },
        },
      ],
    },
  },
];
