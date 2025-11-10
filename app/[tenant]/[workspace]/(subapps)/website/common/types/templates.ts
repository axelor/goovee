import type {Client} from '@/goovee/.generated/client';
import type {CamelCase, ExpandRecursively} from '@/types/util';
import type {
  Payload,
  QueryClient,
  Repository,
  SelectOptions,
} from '@goovee/orm';
import fontAwesome from '../constants/fa-icons';

export enum Template {
  block = 1,
  topMenu = 2,
  leftRightMenu = 3,
}

// === Common Base ===
type CommonField = {
  name: string;
  required?: boolean;
  widgetAttrs?: Record<string, string>;
};

export type SelectionOption<T extends string | number = string | number> = {
  title: string;
  value: T;
  color?: Color;
  icon?: Icon;
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
  defaultValue?: boolean;
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
  defaultValue?: number;
  selection?: SelectionOption<number>[] | string;
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
  defaultValue?: string;
  selection?: SelectionOption<string>[] | string;
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
  defaultValue?: string;
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
  defaultValue?: string;
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
  defaultValue?: string;
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
  defaultValue?: string;
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
  models?: Model[];
  metaModels?: MetaModel[];
  selections?: MetaSelection[];
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

export type MetaSelection = {
  name: string;
  options: readonly SelectionOption[];
};

export type TemplateSchema = {
  title: string;
  code: string;
  type: Template;
  fields: ContentField[];
  models?: Model[];
  metaModels?: MetaModel[];
  selections?: MetaSelection[];
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

// Collect all models recursively (flatten)
type CollectModels<M extends Model | undefined> = M extends Model
  ?
      | M
      | (M extends {models: (infer Sub extends Model)[]}
          ? CollectModels<Sub>
          : never)
  : never;

type CollectMetaModels<M extends Model | undefined> = M extends Model
  ?
      | (M['metaModels'] extends (infer MM extends MetaModel)[] ? MM : never)
      | (M['models'] extends (infer Sub extends Model)[]
          ? CollectMetaModels<Sub>
          : never)
  : never;

type CollectSelections<M extends Model | undefined> = M extends Model
  ?
      | (M['selections'] extends (infer S extends MetaSelection)[] ? S : never)
      | (M['models'] extends (infer Sub extends Model)[]
          ? CollectSelections<Sub>
          : never)
  : never;

type JsonModelAttrs<
  ModelName extends string,
  TSchema extends TemplateSchema,
> = (
  TSchema['models'] extends (infer M extends Model)[]
    ? Extract<M | CollectModels<M>, {name: ModelName}>
    : never
) extends infer Match
  ? Match extends {fields: Field[]}
    ? {
        [F in NonDecorativeFields<Match['fields']> as F extends {required: true}
          ? F['name']
          : never]: FieldType<F, TSchema>;
      } & {
        [F in NonDecorativeFields<Match['fields']> as F extends {required: true}
          ? never
          : F['name']]?: FieldType<F, TSchema>;
      }
    : never
  : never;

type RelationalModelAttrs<
  ModelName extends string,
  TSchema extends TemplateSchema,
> =
  | (TSchema['metaModels'] extends (infer MM extends MetaModel)[] ? MM : never)
  | (TSchema['models'] extends (infer M extends Model)[]
      ? CollectMetaModels<M>
      : never) extends infer AllMetaModels
  ? Extract<AllMetaModels, {name: ModelName}> extends infer Match
    ? Match extends {entity: EntityName; select: any}
      ? Payload<EntityClass<Match['entity']>, {select: Match['select']}>
      : any
    : any
  : any;

type FindSelection<Name extends string, TSchema extends TemplateSchema> =
  | (TSchema['selections'] extends (infer S extends MetaSelection)[]
      ? S
      : never)
  | (TSchema['models'] extends (infer M extends Model)[]
      ? CollectSelections<M>
      : never) extends infer AllSelections
  ? Extract<AllSelections, {name: Name}> extends infer Match
    ? Match extends {options: any}
      ? Match['options']
      : never
    : never
  : never;

type JSONRecord = {
  id: string;
  version: number;
  createdOn?: string | null;
  updatedOn?: string | null;
  name?: string | null;
  jsonModel?: string;
};

type SelectionValue<
  Sel extends readonly {value: any}[] | string | undefined,
  TSchema extends TemplateSchema,
> = Sel extends readonly {value: any}[]
  ? Sel[number]['value']
  : Sel extends string
    ? FindSelection<Sel, TSchema>[number]['value']
    : never;

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
        : F extends {type: 'integer'; selection: any}
          ? SelectionValue<F['selection'], TSchema>
          : F extends {type: 'string'; selection: any}
            ? SelectionValue<F['selection'], TSchema>
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

export type Language = 'en_US' | 'fr_FR';
export type Site = 'lighthouse-en' | 'lighthouse-fr';

type StripIdAndVersion<T> = T extends (infer U)[]
  ? StripIdAndVersion<U>[]
  : T extends Record<string, any>
    ? {
        [K in keyof T as K extends 'id' | 'version'
          ? never
          : K]: StripIdAndVersion<T[K]>;
      }
    : T;

export type Demo<TSchema extends TemplateSchema> = {
  language: Language;
  site: Site;
  page: string;
  sequence: number;
  data: StripIdAndVersion<Data<TSchema>>;
};

export type DemoLite<TSchema extends TemplateSchema> = Omit<
  Demo<TSchema>,
  'data'
> & {data: Record<string, unknown>};

export type ImageType = {
  url: string;
  alt: string;
  width: number;
  height: number;
  metaFile: any;
};
