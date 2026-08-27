import {type ZodType, type ZodSafeParseResult} from 'zod';

export function packIntoFormData(data: unknown): FormData {
  const formData = new FormData();

  try {
    let count = 0;
    const stringify = JSON.stringify(data, (_, value) => {
      if (value && value instanceof File) {
        const key = 'file' + ++count;
        formData.append(key, value);
        return {
          __isFile: true,
          key,
        };
      }
      return value;
    });
    formData.append('content', stringify);

    return formData;
  } catch (e) {
    console.error(e);
    return formData;
  }
}

export function unpackFromFormData(formData: FormData): unknown {
  let data = null;
  try {
    const content = formData.get('content');
    data = JSON.parse(content as string, (_, value) => {
      if (value && value.__isFile) {
        return formData.get(value.key);
      }
      return value;
    });
    return data;
  } catch (e) {
    return data;
  }
}

export function zodParseFormData<T>(formData: FormData, schema: ZodType<T>): T {
  const data = unpackFromFormData(formData);
  const parsed = schema.parse(data);
  return parsed;
}

export function zodSafeParseFormData<T>(
  formData: FormData,
  schema: ZodType<T>,
): ZodSafeParseResult<T> {
  return schema.safeParse(unpackFromFormData(formData));
}
