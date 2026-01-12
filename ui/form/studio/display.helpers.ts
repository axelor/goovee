import {type Field, InputType, type Panel, WidgetType} from '../types';

enum StudioType {
  decimal = 'decimal',
  integer = 'integer',
  panel = 'panel',
  spacer = 'spacer',
  label = 'label',
  separator = 'separator',
  button = 'button',
}

function mapStudioTypes(field: any): InputType {
  switch (field.type) {
    case StudioType.decimal:
    case StudioType.integer:
      return InputType.number;
    default:
      return field.type;
  }
}

const removeContextedFields = (fields: any[], object: any): any[] => {
  if (!Array.isArray(fields) || fields.length === 0) {
    return [];
  }

  if (object == null) {
    return fields;
  }

  return fields?.filter((_field: any) => {
    if (_field.contextField == null) {
      return true;
    }

    const objectValue = object?.[_field.contextField]?.id;
    const parsedValue = objectValue ? parseInt(objectValue, 10) : undefined;

    return parsedValue === parseInt(_field.contextFieldValue, 10);
  });
};

function formatField(_i: any): Field {
  let field: Field = {
    name: _i.name,
    title: _i.title,
    type: mapStudioTypes(_i),
    widget: _i.widget?.toLowerCase() as WidgetType,
    helper: _i.help,
    readonly: _i.readonly,
    required: _i.required,
    order: _i.sequence,
    colSpan: _i?.widgetAttrs?.colSpan,
  };

  if (_i.selection != null) {
    const isMulti = _i.widget?.toLowerCase()?.includes('multi');

    field = {
      ...field,
      type: isMulti ? InputType.array : field.type,
      widget: WidgetType.select,
      options: {
        itemSet: _i.selectionOptions,
        isMulti,
        isInteger: field.type === InputType.number,
      },
      subSchema: (isMulti ? field.type : undefined) as any,
    };
  }

  if (_i.maxSize > 0 || _i.minSize > 0) {
    let validationOptions = {};

    if (_i.maxSize > 0) {
      validationOptions = {
        ...validationOptions,
        max: {value: _i.maxSize},
      };
    }

    if (_i.minSize > 0) {
      validationOptions = {
        ...validationOptions,
        min: {value: _i.minSize},
      };
    }

    field = {
      ...field,
      validationOptions,
    };
  }

  return field;
}

export function formatStudioContent(
  metaFields: any[],
  context?: any,
): {fields: Field[]; panels: Panel[]} {
  const fields: Field[] = [];
  const panels: Panel[] = [];
  let lastPanel: string = '';

  removeContextedFields(metaFields, context).forEach(_item => {
    switch (_item.type) {
      case StudioType.panel:
        lastPanel = _item.name;

        panels.push({
          name: _item.name,
          order: _item.sequence,
          title: _item.title,
        });

        break;
      case StudioType.spacer:
      case StudioType.label:
      case StudioType.separator:
      case StudioType.button:
        break;
      default:
        fields.push({...formatField(_item), parent: lastPanel});
        break;
    }
  });

  return {fields, panels};
}

export function formatStudioFields(items: any[], context?: any): Field[] {
  return removeContextedFields(items, context)
    .filter(
      _i =>
        ![
          StudioType.panel,
          StudioType.spacer,
          StudioType.label,
          StudioType.separator,
          StudioType.button,
        ].includes(_i.type),
    )
    .map(formatField);
}

export function extractCustomData(
  formState: any,
  modelField: string,
  customFields: any[],
): any {
  const result: any = {};
  const customData: any = {};

  for (const [key, value] of Object.entries(formState)) {
    if (customFields.find(({name}) => name == key)) {
      customData[key] = value;
    } else {
      result[key] = value;
    }
  }

  return {...result, [modelField]: JSON.stringify(customData)};
}
