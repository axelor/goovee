import {z, ZodSchema} from 'zod';

// ---- CORE IMPORTS ---- //
import type {Field} from './types';
import {isField} from './display.helpers';

const getRequiredCondition = (schema: any, _field: Field): any => {
  if (!_field.required) {
    return schema.optional();
  }

  return schema;
};

const getFieldSchema = (field: Field) => {
  let schema = null;

  switch (field.type) {
    case 'string':
      schema = z.string();

      if (field.required) {
        schema = schema.min(1, 'Required');
      }
      break;
    case 'number':
      schema = z.coerce.number();
      break;
    case 'boolean':
      schema = z.boolean();
      break;
    case 'array':
      if (field.subSchema != null) {
        if (typeof field.subSchema === 'string') {
          schema = (z[field.subSchema] as any)();
        } else {
          schema = createFormSchema(field.subSchema);
        }
      } else {
        schema = z.object({}).passthrough();
      }

      schema = schema.array();
      break;
    case 'object':
      schema = z.object({}).passthrough();
      break;
    default:
      throw new Error(`Type ${field.type} is not managed for schema creation`);
  }

  switch (field.widget) {
    case 'email':
      schema = schema.email();
      break;
    case 'url':
      schema = schema.url();
      break;
    case 'phone':
      schema = schema.regex(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/g);
      break;
    default:
      break;
  }

  if (field.validationOptions != null) {
    for (const [key, _options] of Object.entries(field.validationOptions)) {
      if (_options?.value != null) {
        if (_options?.customErrorKey != null) {
          schema = schema?.[key](_options.value, _options.customErrorKey);
        } else {
          schema = schema?.[key](_options.value);
        }
      } else {
        if (_options?.customErrorKey != null) {
          schema = schema?.[key](_options.customErrorKey);
        } else {
          schema = schema?.[key]();
        }
      }
    }
  }

  return getRequiredCondition(schema, field);
};

export function createFormSchema(fields: Field[]): ZodSchema {
  let schemaConfig: any = {};

  fields
    .filter(
      _field =>
        isField(_field) && !_field.readonly && _field.type !== 'ornament',
    )
    .forEach(_field => {
      schemaConfig[_field.name] = getFieldSchema(_field);
    });

  return z.object(schemaConfig);
}
