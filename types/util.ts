import {BigDecimal} from '@goovee/orm';

export type Maybe<T> = T | null | undefined;

export type Expand<T> = T extends (...args: infer A) => infer R
  ? (...args: Expand<A>) => Expand<R>
  : T extends infer O
    ? {[K in keyof O]: O[K]}
    : never;

export type ExpandRecursively<T> = T extends (...args: infer A) => infer R
  ? (...args: ExpandRecursively<A>) => ExpandRecursively<R>
  : T extends Date
    ? Date
    : T extends BigDecimal
      ? BigDecimal
      : T extends Promise<infer U>
        ? Promise<ExpandRecursively<U>>
        : T extends object
          ? T extends infer O
            ? {[K in keyof O]: ExpandRecursively<O[K]>}
            : never
          : T;

export type Merge<A, B> = {
  [K in keyof A | keyof B]: K extends keyof A & keyof B
    ? A[K] | B[K]
    : K extends keyof B
      ? B[K]
      : K extends keyof A
        ? A[K]
        : never;
};

export type KeyOf<T extends Iterable<any>> =
  T extends Iterable<infer E> ? E : never;

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type JSONPrimitive = string | number | boolean | null | undefined;

export type JSONValue =
  | JSONPrimitive
  | JSONValue[]
  | {
      [key: string]: JSONValue;
    };

export type NotAssignableToJson = bigint | symbol | Function;

export type Cloned<T> = T extends JSONValue
  ? T
  : T extends Date
    ? string
    : T extends BigDecimal
      ? string
      : T extends NotAssignableToJson
        ? never
        : T extends object
          ? {[K in keyof T]: Cloned<T[K]>}
          : never;

/**
 * CamelCase (medium) – https://github.com/type-challenges/type-challenges/blob/master/questions/610-medium-camelcase/README.md
 * CamelCase (hard) – https://github.com/type-challenges/type-challenges/blob/master/questions/114-hard-camelcase/README.md
 */

type Separator = '_' | '-';

type FilterEmptyWord<
  Word,
  T extends unknown[],
  S extends 'start' | 'end',
> = Word extends ''
  ? T
  : {
      start: [Word, ...T];
      end: [...T, Word];
    }[S];

type SplitBySeparator<S> = S extends `${infer Word}${Separator}${infer Rest}`
  ? FilterEmptyWord<Word, SplitBySeparator<Rest>, 'start'>
  : FilterEmptyWord<S, [], 'start'>;

type IsRepeatedSeparator<Ch, Validated> = Ch extends Separator
  ? Validated extends `${string}${Separator}`
    ? true
    : false
  : false;

type RemoveRepeatedSeparator<
  NotValidated,
  Validated = '',
> = NotValidated extends `${infer Ch}${infer Rest}`
  ? IsRepeatedSeparator<Ch, Validated> extends true
    ? RemoveRepeatedSeparator<Rest, Validated>
    : RemoveRepeatedSeparator<Rest, `${Validated & string}${Ch}`>
  : Validated;

type IsUppercase<Ch extends string> = [Ch] extends [Uppercase<Ch>]
  ? true
  : false;

type SplitByCapital<
  S,
  Word extends string = '',
  Words extends unknown[] = [],
> = S extends ''
  ? FilterEmptyWord<Word, Words, 'end'>
  : S extends `${infer Ch}${infer Rest}`
    ? IsUppercase<Ch> extends true
      ? SplitByCapital<Rest, Ch, FilterEmptyWord<Word, Words, 'end'>>
      : SplitByCapital<Rest, `${Word}${Ch}`, Words>
    : [];

type WhichApproach<S> = S extends `${string}${Separator}${string}`
  ? 'separatorBased'
  : 'capitalBased';

type Words<S> = {
  separatorBased: SplitBySeparator<RemoveRepeatedSeparator<S>>;
  capitalBased: IsUppercase<S & string> extends true ? [S] : SplitByCapital<S>;
}[WhichApproach<S>];

type WordCase<S, C extends 'pascal' | 'lower'> = {
  pascal: Capitalize<WordCase<S, 'lower'> & string>;
  lower: Lowercase<S & string>;
}[C];

type PascalCasify<T, R extends unknown[] = []> = T extends [
  infer Head,
  ...infer Rest,
]
  ? PascalCasify<Rest, [...R, WordCase<Head, 'pascal'>]>
  : R;

type CamelCasify<T> = T extends [infer Head, ...infer Rest]
  ? PascalCasify<Rest, [WordCase<Head, 'lower'>]>
  : [];

type Join<T, S extends string = ''> = T extends [infer Word, ...infer Rest]
  ? Join<Rest, `${S}${Word & string}`>
  : S;

export type CamelCase<S extends string> = Join<CamelCasify<Words<S>>>;

/** cameCase ends here **/
