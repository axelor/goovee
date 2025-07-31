import type {Client} from '@/goovee/.generated/client';
import type {CamelCase, ExpandRecursively} from '@/types/util';
import type {
  Payload,
  QueryClient,
  Repository,
  SelectOptions,
} from '@goovee/orm';
import fontAwesome from '../constants/fa-icons';

// === Common Base ===
type CommonField = {
  name: string;
  required?: boolean;
  widgetAttrs?: Record<string, string>;
};

type Color =
  | 'red'
  | 'pink'
  | 'purple'
  | 'deeppurple'
  | 'indigo'
  | 'blue'
  | 'lightblue'
  | 'cyan'
  | 'teal'
  | 'green'
  | 'lightgreen'
  | 'lime'
  | 'yellow'
  | 'amber'
  | 'orange'
  | 'deeporange'
  | 'brown'
  | 'grey'
  | 'bluegrey'
  | 'black'
  | 'white';

type Icon = (typeof fontAwesome)[number];

// === Primitive Fields ===
type BooleanField = CommonField & {
  type: 'boolean';
  title: string;
  widget?:
    | 'InlineCheckbox'
    | 'Toggle'
    | 'BooleanSelect'
    | 'BooleanRadio'
    | 'BooleanSwitch'
    | 'NavSelect'
    | 'CheckboxSelect'
    | 'RadioSelect'
    | 'MultiSelect'
    | 'ImageSelect';
};

type IntegerField = CommonField & {
  type: 'integer';
  title: string;
  selection?: {
    title: string;
    value: number;
    color?: Color;
    icon?: Icon;
  }[];
  widget?:
    | 'RelativeTime'
    | 'Duration'
    | 'Progress'
    | 'SelectProgress'
    | 'NavSelect'
    | 'CheckboxSelect'
    | 'RadioSelect'
    | 'MultiSelect'
    | 'ImageSelect';
};

type StringField = CommonField & {
  type: 'string';
  title: string;
  selection?: {
    title: string;
    value: string;
    color?: Color;
    icon?: Icon;
  }[];
  widget?:
    | 'Email'
    | 'Url'
    | 'Password'
    | 'Html'
    | 'CodeEditor'
    | 'ImageLine'
    | 'NavSelect'
    | 'CheckboxSelect'
    | 'RadioSelect'
    | 'MultiSelect'
    | 'ImageSelect';
};

type DecimalField = CommonField & {
  type: 'decimal';
  title: string;
  widget?:
    | 'RelativeTime'
    | 'Duration'
    | 'Progress'
    | 'SelectProgress'
    | 'NavSelect'
    | 'CheckboxSelect'
    | 'RadioSelect'
    | 'MultiSelect'
    | 'ImageSelect';
};

type DatetimeField = CommonField & {
  type: 'datetime';
  title: string;
  widget?:
    | 'NavSelect'
    | 'CheckboxSelect'
    | 'RadioSelect'
    | 'MultiSelect'
    | 'ImageSelect';
};

type DateField = CommonField & {
  type: 'date';
  title: string;
  widget?:
    | 'NavSelect'
    | 'CheckboxSelect'
    | 'RadioSelect'
    | 'MultiSelect'
    | 'ImageSelect';
};

type TimeField = CommonField & {
  type: 'time';
  title: string;
  widget?:
    | 'NavSelect'
    | 'CheckboxSelect'
    | 'RadioSelect'
    | 'MultiSelect'
    | 'ImageSelect';
};

export type PrimitiveField =
  | BooleanField
  | IntegerField
  | StringField
  | DecimalField
  | DatetimeField
  | DateField
  | TimeField;

// === Relational Fields ===
type ManyToOneField = CommonField & {
  type: 'many-to-one';
  title: string;
  target: string;
  widget?: 'SuggestBox' | 'Image' | 'binary-link';
};

type OneToManyField = CommonField & {
  type: 'one-to-many';
  title: string;
  target: string;
  widget?: 'TagSelect';
};

type ManyToManyField = CommonField & {
  type: 'many-to-many';
  title: string;
  target: string;
  widget?: 'TagSelect';
};

export type RelationalField = ManyToOneField | OneToManyField | ManyToManyField;

// === JSON Relational Fields ===
type JsonManyToOneField = CommonField & {
  type: 'json-many-to-one';
  title: string;
  target: string;
  widget?: 'SuggestBox' | 'Image' | 'binary-link';
};

type JsonOneToManyField = CommonField & {
  type: 'json-one-to-many';
  title: string;
  target: string;
  widget?: 'TagSelect';
};

type JsonManyToManyField = CommonField & {
  type: 'json-many-to-many';
  title: string;
  target: string;
  widget?: 'TagSelect';
};

export type JsonRelationalField =
  | JsonManyToOneField
  | JsonOneToManyField
  | JsonManyToManyField;

export type ArrayField =
  | OneToManyField
  | ManyToManyField
  | JsonOneToManyField
  | JsonManyToManyField;

export type ObjectField = ManyToOneField | JsonManyToOneField;
// === Decorative Fields ===
type PanelField = CommonField & {
  type: 'panel';
  title?: string;
};

export type DecorativeField = PanelField;

// === Field Groups ===
type ContentField =
  | PrimitiveField
  | RelationalField
  | JsonRelationalField
  | DecorativeField;

type ModelField = ContentField & {
  nameField?: boolean;
  visibleInGrid?: boolean;
};

export type Field = ContentField | ModelField;

export type Type = Field extends {type: infer T} ? T : never;

export type CustomField = Field & {
  contextField?: string;
  contextFieldValue?: string;
  contextFieldTarget?: string;
  contextFieldTargetName?: string;
  contextFieldTitle?: string;
};

export type Model = {
  name: string;
  title: string;
  fields: ModelField[];
};

type Entities = Omit<Client, keyof QueryClient>;
export type EntityName = keyof Entities;
type EntityClass<Name extends EntityName> =
  Omit<Client, keyof QueryClient>[Name] extends Repository<infer U> ? U : never;

export type MetaModel<T extends EntityName = any> = {
  name: string;
  entity: T;
  select: SelectOptions<EntityClass<T>>;
};

export enum Template {
  block = 1,
  topMenu = 2,
  leftRightMenu = 3,
}

export type TemplateSchema = {
  title: string;
  code: string;
  type: Template;
  fields: ContentField[];
  models?: Model[];
  metaModels?: MetaModel[];
};

// === Type Resolution ===
type PrimitiveMap = {
  string: string;
  integer: number;
  decimal: number;
  datetime: string;
  date: string;
  time: string;
  boolean: boolean;
};

type JsonToMany = 'json-one-to-many' | 'json-many-to-many';
type JsonToOne = 'json-many-to-one';
type RelToMany = 'one-to-many' | 'many-to-many';
type RelToOne = 'many-to-one';
type DecorativeFieldType = 'panel';

// Remove decorative fields from consideration in output types
type NonDecorativeFields<T extends Field[]> = T extends (infer F)[]
  ? F extends {type: DecorativeFieldType}
    ? never
    : F
  : never;

type JsonModelAttrs<
  ModelName extends string,
  TSchema extends TemplateSchema,
> = TSchema['models'] extends any[]
  ? Extract<TSchema['models'][number], {name: ModelName}> extends infer M
    ? M extends {fields: Field[]}
      ? {
          [F in NonDecorativeFields<M['fields']> as F extends {required: true}
            ? F['name']
            : never]: FieldType<F, TSchema>;
        } & {
          [F in NonDecorativeFields<M['fields']> as F extends {required: true}
            ? never
            : F['name']]?: FieldType<F, TSchema>;
        }
      : never
    : never
  : never;

type RelationalModelAttrs<
  ModelName extends string,
  TSchema extends TemplateSchema,
> = TSchema['metaModels'] extends any[]
  ? Extract<TSchema['metaModels'][number], {name: ModelName}> extends infer M
    ? M extends {entity: EntityName; select: any}
      ? Payload<EntityClass<M['entity']>, {select: M['select']}>
      : any
    : any
  : any;

type JSONRecord = {
  id: string;
  version: number;
  createdOn?: string | null;
  updatedOn?: string | null;
  name?: string | null;
  jsonModel?: string;
};
type SelectionValue<T> = T extends readonly {value: infer V}[] ? V : never;

type FieldType<F, TSchema extends TemplateSchema> = F extends {
  type: JsonToMany;
  target: string;
}
  ? (JSONRecord & {attrs: JsonModelAttrs<F['target'], TSchema>})[]
  : F extends {type: JsonToOne; target: string}
    ? JSONRecord & {attrs: JsonModelAttrs<F['target'], TSchema>}
    : F extends {type: RelToMany; target: string}
      ? RelationalModelAttrs<F['target'], TSchema>[]
      : F extends {type: RelToOne; target: string}
        ? RelationalModelAttrs<F['target'], TSchema>
        : F extends {type: 'integer'; selection: readonly any[]}
          ? SelectionValue<F['selection']>
          : F extends {type: 'string'; selection: readonly any[]}
            ? SelectionValue<F['selection']>
            : F extends {type: keyof PrimitiveMap}
              ? PrimitiveMap[F['type']]
              : F extends {type: DecorativeFieldType}
                ? never
                : unknown;

type FieldKey<
  F extends {name: string},
  TSchema extends {code: string},
> = `${CamelCase<TSchema['code']>}${Capitalize<CamelCase<F['name']>>}`;

export type Data<TSchema extends TemplateSchema> = ExpandRecursively<
  {
    [F in NonDecorativeFields<TSchema['fields']> as F extends {required: true}
      ? FieldKey<F, TSchema>
      : never]: FieldType<F, TSchema>;
  } & {
    [F in NonDecorativeFields<TSchema['fields']> as F extends {required: true}
      ? never
      : FieldKey<F, TSchema>]?: FieldType<F, TSchema>;
  }
>;

export type Demo<TSchema extends TemplateSchema> = {
  language: 'en_US' | 'fr_FR';
  data: Data<TSchema>;
};
