import React from 'react';
import {type Field, DEFAULT_COLSPAN, InputType, WidgetType} from './types';

export function mapFieldType(field: Field): React.HTMLInputTypeAttribute {
  if (field.widget != null) {
    switch (field.widget.toLowerCase()) {
      case WidgetType.email:
        return 'email';
      case WidgetType.phone:
        return 'tel';
      case WidgetType.url:
        return 'url';
      default:
        break;
    }
  }

  switch (field.type) {
    case InputType.string:
      return 'text';
    default:
      return field.type;
  }
}

export function getColspan(value: number | undefined) {
  return (Math.min(value ?? 0, DEFAULT_COLSPAN) / DEFAULT_COLSPAN) * 100;
}

export function isField(item: any): boolean {
  return item?.type != null;
}

function getItemDefaultValue(item: Field): any {
  switch (item.type) {
    case InputType.string:
      return '';
    case InputType.number:
      return 0;
    case InputType.boolean:
      return false;
    case InputType.array:
      return [];
    default:
      return undefined;
  }
}

export function createDefaultValues(items: Field[]) {
  const result: any = {};

  items.forEach(_i => {
    result[_i.name] = getItemDefaultValue(_i);
  });

  return result;
}
