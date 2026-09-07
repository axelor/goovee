/*
 * Reads the configuration schema as a tree: which keys an object holds, whether a
 * setting is optional, what kind of value a leaf takes, what its description
 * says. What counts as a group and what counts as a leaf is decided here rather
 * than per reader.
 *
 * Everything reads the input side of the schema: the shape a document is
 * written in, before a transform settles a value. That is the shape an operator
 * types and the one a variable name spells.
 */

import {z} from 'zod';

/** The value a leaf setting takes, as the environment has to spell it. */
export type LeafKind = 'string' | 'number' | 'integer' | 'boolean' | 'enum';

/**
 * The schema underneath the wrappers that change nothing about its shape: an
 * optional or defaulted setting is still the setting, and a transformed object
 * is still written as the object it transforms.
 */
export function unwrap(schema: z.ZodType): z.ZodType {
  let current = schema;

  for (;;) {
    if (
      current instanceof z.ZodOptional ||
      current instanceof z.ZodDefault ||
      current instanceof z.ZodNullable ||
      current instanceof z.ZodReadonly
    ) {
      current = current.unwrap() as z.ZodType;
      continue;
    }

    if (current instanceof z.ZodPipe) {
      current = current.in as z.ZodType;
      continue;
    }

    return current;
  }
}

/** Whether a document may leave the setting out. */
export function isOptional(schema: z.ZodType): boolean {
  return schema instanceof z.ZodOptional || schema instanceof z.ZodDefault;
}

/** The keys and schemas of a group, or null for a leaf. */
export function shapeOf(schema: z.ZodType): Record<string, z.ZodType> | null {
  const inner = unwrap(schema);

  return inner instanceof z.ZodObject
    ? (inner.shape as Record<string, z.ZodType>)
    : null;
}

/**
 * The value schema of a record — the tenants, keyed by id — or null for
 * anything else.
 */
export function recordValueOf(schema: z.ZodType): z.ZodType | null {
  const inner = unwrap(schema);

  return inner instanceof z.ZodRecord ? (inner.valueType as z.ZodType) : null;
}

/**
 * The schema at `path` below `root`, walking groups by key and a record by any
 * key, or null where the path names nothing. For a message about a path a zod
 * issue reported, which is a path through the input shape.
 */
export function schemaAt(
  root: z.ZodType,
  path: ReadonlyArray<PropertyKey>,
): z.ZodType | null {
  let current: z.ZodType | null = root;

  for (const segment of path) {
    if (!current) return null;

    const record = recordValueOf(current);

    if (record) {
      current = record;
      continue;
    }

    current = shapeOf(current)?.[String(segment)] ?? null;
  }

  return current;
}

/** What a leaf takes, or null where the schema is a group. */
export function leafKind(schema: z.ZodType): LeafKind | null {
  const inner = unwrap(schema);

  if (inner instanceof z.ZodString) return 'string';
  if (inner instanceof z.ZodBoolean) return 'boolean';
  if (inner instanceof z.ZodEnum) return 'enum';

  if (inner instanceof z.ZodNumber) {
    // `z.int()` is a number whose format says so.
    const format: unknown = (inner.def as {format?: unknown}).format;

    return format === 'safeint' || format === 'int32' ? 'integer' : 'number';
  }

  return null;
}

/** The values an enum leaf admits; empty for a schema that is not an enum. */
export function enumValues(schema: z.ZodType): string[] {
  const inner = unwrap(schema);

  return inner instanceof z.ZodEnum ? inner.options.map(String) : [];
}

/**
 * The operator-facing description, read off the outermost wrapper first and
 * then off the schema inside it, since `.describe()` may sit on either.
 */
export function descriptionOf(schema: z.ZodType): string | undefined {
  return schema.description ?? unwrap(schema).description;
}

/**
 * A value as the environment spells it, turned into what the leaf expects. A
 * spelling the leaf cannot take is left as the string it was, so the parse
 * reports it against the setting rather than this guessing.
 */
export function coerceLeaf(schema: z.ZodType, value: string): unknown {
  switch (leafKind(schema)) {
    case 'integer':
      return /^-?\d+$/.test(value) ? Number(value) : value;
    case 'number':
      return /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value;
    case 'boolean':
      return value === 'true' ? true : value === 'false' ? false : value;
    default:
      return value;
  }
}
