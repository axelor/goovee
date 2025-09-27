import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {solidIcons} from '@/subapps/website/common/icons/solid';
import {startCase} from 'lodash-es';

export const service7Schema = {
  title: 'Service 7',
  code: 'service7',
  type: Template.block,
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'services',
      title: 'Services',
      type: 'json-one-to-many',
      target: 'Service7Service',
    },
  ],
  models: [
    {
      name: 'Service7Service',
      title: 'Service',
      fields: [
        {
          name: 'icon',
          title: 'Icon',
          type: 'string',
          selection: solidIcons.map(icon => ({
            title: startCase(icon),
            value: icon,
          })),
        },
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'description',
          title: 'Description',
          type: 'string',
        },
      ],
    },
  ],
} as const satisfies TemplateSchema;

export type Service7Data = Data<typeof service7Schema>;

export const service7Demos: Demo<typeof service7Schema>[] = [
  {
    language: 'en_US',
    data: {
      service7Caption: 'App Features',
      service7Title:
        'By using Lighthouse, you can monitor all of your health-related objectives in a single application.',
      service7Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            icon: 'HandHoldingMedical',
            title: 'Primary Care',
            description:
              'Many of these services may be provide by primary care physicians, while other may require a referral to a specialist.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            icon: 'SuitcaseMdical',
            title: 'Maintain Health',
            description:
              'Many of these services may be provide by primary care physicians, while other may require a referral to a specialist.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            icon: 'BrainPlus',
            title: 'Pain Management',
            description:
              'Many of these services may be provide by primary care physicians, while other may require a referral to a specialist.',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            icon: 'ScaleUnbalanced',
            title: 'Weight Management',
            description:
              'Many of these services may be provide by primary care physicians, while other may require a referral to a specialist.',
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            icon: 'Stethoscope',
            title: 'Diagnostic Reports',
            description:
              'Many of these services may be provide by primary care physicians, while other may require a referral to a specialist.',
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            icon: 'TruckMedical',
            title: 'Emergency Care',
            description:
              'Many of these services may be provide by primary care physicians, while other may require a referral to a specialist.',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      service7Caption: 'Fonctionnalités de l’application',
      service7Title:
        'En utilisant Lighthouse, vous pouvez surveiller tous vos objectifs liés à la santé dans une seule application.',
      service7Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            icon: 'HandHoldingMedical',
            title: 'Soins primaires',
            description:
              'Beaucoup de ces services peuvent être fournis par des médecins de premier recours, tandis que d’autres peuvent nécessiter une orientation vers un spécialiste.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            icon: 'SuitcaseMdical',
            title: 'Maintenir la santé',
            description:
              'Beaucoup de ces services peuvent être fournis par des médecins de premier recours, tandis que d’autres peuvent nécessiter une orientation vers un spécialiste.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            icon: 'BrainPlus',
            title: 'Gestion de la douleur',
            description:
              'Beaucoup de ces services peuvent être fournis par des médecins de premier recours, tandis que d’autres peuvent nécessiter une orientation vers un spécialiste.',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            icon: 'ScaleUnbalanced',
            title: 'Gestion du poids',
            description:
              'Beaucoup de ces services peuvent être fournis par des médecins de premier recours, tandis que d’autres peuvent nécessiter une orientation vers un spécialiste.',
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            icon: 'Stethoscope',
            title: 'Rapports de diagnostic',
            description:
              'Beaucoup de ces services peuvent être fournis par des médecins de premier recours, tandis que d’autres peuvent nécessiter une orientation vers un spécialiste.',
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            icon: 'TruckMedical',
            title: 'Soins d’urgence',
            description:
              'Beaucoup de ces services peuvent être fournis par des médecins de premier recours, tandis que d’autres peuvent nécessiter une orientation vers un spécialiste.',
          },
        },
      ],
    },
  },
];
