import {Field, InputType, Panel, WidgetType} from '@/ui/form';
import type {Column} from '@/ui/grid';

import {MetaFieldType, SchemaItem, SchemaItemType, SchemaType} from './types';
import {findView} from './orm';
import {getModelData} from './actions';

function mapStudioType(_type: MetaFieldType): InputType {
  switch (_type) {
    case MetaFieldType.boolean:
      return InputType.boolean;
    case MetaFieldType.integer:
    case MetaFieldType.decimal:
    case MetaFieldType.long:
      return InputType.number;
    case MetaFieldType.m2o:
    case MetaFieldType.o2o:
      return InputType.object;
    case MetaFieldType.o2m:
    case MetaFieldType.m2m:
      return InputType.array;
    case MetaFieldType.date:
    case MetaFieldType.datetime:
    case MetaFieldType.string:
    case MetaFieldType.text:
    default:
      return InputType.string;
  }
}

async function getFieldType(
  field: any,
  item: SchemaItem,
): Promise<{[key: string]: any; type: InputType}> {
  const jsonType = field?.type?.toLowerCase();
  const type = mapStudioType(jsonType);
  const modelName = field?.target;

  if (modelName != null) {
    if (type === InputType.array) {
      let config: any = {model: modelName};

      if (item.formView != null) {
        const {fields, panels} = await getGenericFormContent(item.formView);
        config = {...config, fields, panels};
      }

      if (item.gridView != null) {
        const {columns} = await getGenericGridContent(item.gridView);
        config = {...config, columns};

        if (item.canSelect === 'true' && jsonType === MetaFieldType.m2m) {
          const data = await getModelData(modelName);
          config = {...config, data};
        }
      }

      return {type, options: {config}};
    }

    const data = await getModelData(modelName);

    return {
      type,
      options: {
        data,
        targetModel: modelName,
        targetName: field?.targetName ?? 'name',
      },
    };
  }

  if (field?.selection != null) {
    const isMulti = item.widget?.toLowerCase()?.includes('multi');

    return {
      type: isMulti ? InputType.array : type,
      widget: WidgetType.select,
      options: {
        itemSet: field.selectionList,
        isMulti,
        isInteger: type === InputType.number,
      },
      subSchema: isMulti ? type : undefined,
    };
  }

  return {type};
}

export async function getGenericFormContent(viewName: string) {
  const {schema, metaFields} = await findView({
    name: viewName,
    schemaType: SchemaType.form,
  });

  return {
    ...(await formatSchema(schema?.items ?? [], metaFields ?? [])),
    model: schema?.model,
  };
}

export async function formatSchema(
  schema: SchemaItem[],
  metaFields: any[],
  parent?: string,
): Promise<{fields: Field[]; panels: Panel[]}> {
  const fields: Field[] = [];
  const panels: Panel[] = [];

  for (let idx = 0; idx < schema.length; idx++) {
    const _item = schema[idx];

    if (_item.type === SchemaItemType.panel) {
      const _name = _item.name ?? `${parent ?? SchemaItemType.panel}-${idx}`;
      panels.push({
        parent,
        name: _name,
        title: _item.title,
        colSpan:
          _item.colSpan != null ? parseInt(_item.colSpan, 10) : undefined,
      });

      const {fields: panelsFields, panels: subPanels} = await formatSchema(
        _item.items,
        metaFields,
        _name,
      );

      fields.push(...(panelsFields ?? []));
      panels.push(...(subPanels ?? []));
    } else if (_item.type === SchemaItemType.field) {
      const _field = metaFields.find(_f => _f.name === _item.name);
      const typeConfig = await getFieldType(_field, _item);
      fields.push({
        parent,
        name: _item.name,
        title: !!_item.showTitle ? undefined : (_item.title ?? _field?.title),
        widget: _item.widget as WidgetType,
        hidden: _item.hidden ?? false,
        required: _item.required ?? false,
        readonly: _item.readonly ?? false,
        colSpan:
          _item.colSpan != null ? parseInt(_item.colSpan, 10) : undefined,
        ...typeConfig,
      });
    }
  }

  return {fields, panels};
}

export async function getGenericGridContent(viewName: string) {
  const {schema, metaFields} = await findView({
    name: viewName,
    schemaType: SchemaType.grid,
  });

  return {
    ...formatGridSchema(
      schema?.items ?? [],
      schema?.sortable,
      metaFields ?? [],
    ),
    model: schema?.model,
  };
}

export function formatGridSchema(
  schema: SchemaItem[],
  sortable = false,
  metaFields: any[],
): {
  columns: Partial<Column>[];
} {
  const columns: Partial<Column>[] = [];

  schema.forEach((_item: any) => {
    if (_item.type === SchemaItemType.field) {
      const name = _item.name;
      const _field = metaFields?.find(_f => _f.name === name);

      columns.push({
        key: name,
        label: !!_item.showTitle ? undefined : (_item.title ?? _field?.title),
        hidden: _item.hidden ?? false,
        targetName: _item.targetName,
        sortable,
        mobile: columns.length === 0,
        selectionList: _field?.selectionList,
      });
    }
  });

  return {columns};
}
