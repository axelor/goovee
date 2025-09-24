import {Tenant} from '@/lib/core/tenant';
import {
  COMPONENT_MODEL,
  CONTENT_MODEL,
  CONTENT_MODEL_ATTRS,
  JSON_MODEL,
  JSON_MODEL_ATTRS,
  RelationalFieldTypes,
  JsonRelationalFieldTypes,
  ArrayFieldTypes,
  ObjectFieldTypes,
} from '@/subapps/website/common/constants';
import {
  createCMSContent,
  createCustomFields,
  createMetaJsonModel,
  createCMSComponent,
  deleteCustomFields,
  deleteMetaJsonModels,
  createMetaSelect,
  getCommnonSelectionName,
  deleteMetaSelects,
} from '@/subapps/website/common/orm/templates';
import {camelCase} from 'lodash-es';
import {metas} from '@/subapps/website/common/templates/metas';
import {
  ArrayField,
  CustomField,
  Demo,
  Field,
  JsonRelationalField,
  TemplateSchema,
  Model,
  ObjectField,
  RelationalField,
  MetaSelection,
} from '../types/templates';
import {
  processBatch,
  Cache,
  formatCustomFieldName,
  collectModels,
  collectSelections,
  collectUniqueModels,
  collectUniqueSelections,
  formatComponentCode,
} from './helper';

const CUSTOM_MODEL_PREFIX = 'GooveeTemplate';

function capitalCase(str: string) {
  str = camelCase(str);
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatCustomModelName(modelName: string) {
  return CUSTOM_MODEL_PREFIX + capitalCase(modelName);
}

export function isRelationalField(field: Field): field is RelationalField {
  return RelationalFieldTypes.includes(field.type);
}

export function isJsonRelationalField(
  field: Field,
): field is JsonRelationalField {
  return JsonRelationalFieldTypes.includes(field.type);
}

export function isArrayField(field: Field): field is ArrayField {
  return ArrayFieldTypes.includes(field.type);
}

export function isObjectField(field: Field): field is ObjectField {
  return ObjectFieldTypes.includes(field.type);
}

/** conditons
 * 1. model should have at least one field
 * 2. model should have only one nameField
 * 3. model should have at least one visibleInGrid field
 * 4. json target model should have a model declaration within the same schema
 * 5. selection should have a selection declaration within the same schema
 * 6. model names should be unique if models are not referencially equal
 * 7. selection names should be unique if selections are not referencially equal
 * 8. selections should have at least one option
 */
function validateSchemas(schemas: TemplateSchema[]) {
  let isValid = true;
  const jsonModelMap = new Map<string, Model>();
  const selectionMap = new Map<string, MetaSelection>();
  schemas.forEach(schema => {
    const targetModels = new Set();
    const targetSelections = new Set();
    schema.fields?.forEach(field => {
      if (isJsonRelationalField(field)) {
        targetModels.add(field.target);
      }
      if ('selection' in field && typeof field.selection === 'string') {
        targetSelections.add(field.selection);
      }
    });

    const models = collectModels(schema);
    models?.forEach(model => {
      if (
        jsonModelMap.has(model.name) &&
        model !== jsonModelMap.get(model.name) // check reference equality
      ) {
        isValid = false;
        console.log(
          `\x1b[31m✖ model:${model.name} in ${schema.code} is duplicated.\x1b[0m`,
        );
      }
      jsonModelMap.set(model.name, model);
      let nameFieldCount = 0;
      let visibleInGridCount = 0;
      if (!model.fields.length) {
        isValid = false;
        console.log(
          `\x1b[31m✖ model:${model.name} in ${schema.code} should have at least 1 field.\x1b[0m`,
        );
      }
      for (const field of model.fields) {
        if (isJsonRelationalField(field)) {
          targetModels.add(field.target);
        }
        if ('selection' in field && typeof field.selection === 'string') {
          targetSelections.add(field.selection);
        }
        if (field.visibleInGrid) visibleInGridCount++;
        if (field.nameField) nameFieldCount++;
        if (nameFieldCount > 1) {
          isValid = false;
        }
      }
      if (nameFieldCount > 1) {
        console.log(
          `\x1b[31m✖ model:${model.name} in ${schema.code} has more than 1 nameField .\x1b[0m`,
        );
      }
      if (visibleInGridCount === 0) {
        isValid = false;
        console.log(
          `\x1b[31m✖ model:${model.name} in ${schema.code} should have at least 1 visibleInGrid field .\x1b[0m`,
        );
      }
      targetModels.delete(model.name);
    });
    if (targetModels.size) {
      isValid = false;
      console.log(
        `\x1b[31m✖ model:${[...targetModels].join(', ')} in ${schema.code} does not have a model declaration .\x1b[0m`,
      );
    }

    const selections = collectSelections(schema);
    selections?.forEach(selection => {
      if (!selection.options?.length) {
        isValid = false;
        console.log(
          `\x1b[31m✖ selection:${selection.name} in ${schema.code} should have at least 1 option.\x1b[0m`,
        );
      }
      if (
        selectionMap.has(selection.name) &&
        selection !== selectionMap.get(selection.name) // check reference equality
      ) {
        isValid = false;
        console.log(
          `\x1b[31m✖ selection:${selection.name} in ${schema.code} is duplicated.\x1b[0m`,
        );
      }
      selectionMap.set(selection.name, selection);
      targetSelections.delete(selection.name);
    });

    if (targetSelections.size) {
      isValid = false;
      console.log(
        `\x1b[31m✖ selection:${[...targetSelections].join(', ')} in ${schema.code} does not have a selection declaration .\x1b[0m`,
      );
    }
  });

  return isValid;
}

function getModels(schemas: TemplateSchema[]): Model[] {
  const models = new Map<string, Model>();

  for (const schema of schemas) {
    collectUniqueModels(schema, models);
  }
  return Array.from(models.values());
}

function getSelections(schemas: TemplateSchema[]): Map<string, MetaSelection> {
  const selections = new Map<string, MetaSelection>();

  for (const schema of schemas) {
    collectUniqueSelections(schema, selections);
  }
  return selections;
}

function getContentFields(
  schemas: TemplateSchema[],
  components: {id: string; code?: string; title?: string}[],
): CustomField[] {
  const fields = [];
  for (const schema of schemas) {
    const component = components.find(c => c.code === schema.code);
    if (!component) continue;
    if (schema.fields.length) {
      fields.push(
        ...schema.fields.map(field => ({
          ...field,
          contextField: 'component',
          contextFieldTarget: COMPONENT_MODEL,
          contextFieldTargetName: 'title',
          contextFieldTitle: component.title,
          contextFieldValue: component.id,
        })),
      );
    }
  }
  return fields;
}

function formatModels(models: Model[]): Model[] {
  return models?.map(model => ({
    ...model,
    name: formatCustomModelName(model.name),
    fields: model.fields.map(field => {
      if (isJsonRelationalField(field)) {
        return {
          ...field,
          name: formatCustomFieldName(field.name),
          target: formatCustomModelName(field.target),
        };
      }
      return field;
    }),
    ...(model.models && {models: formatModels(model.models)}),
  }));
}

function formatSchema<T extends TemplateSchema>(schema: T): T {
  const code = formatComponentCode(schema.code);
  return {
    ...schema,
    code,
    fields: schema.fields?.map(field => ({
      ...field,
      name: formatCustomFieldName(field.name, code),
      ...(isJsonRelationalField(field) && {
        target: formatCustomModelName(field.target),
      }),
    })),
    ...(schema.models && {models: formatModels(schema.models)}),
  };
}

export async function seedComponents(tenantId: Tenant['id']) {
  const _schemas = metas.map(demo => demo.schema);
  if (!validateSchemas(_schemas)) {
    throw new Error('\x1b[31m✖ Invalid schema.\x1b[0m');
  }
  const schemas = _schemas.map(formatSchema);

  const componentsSettled = await processBatch(metas, async ({schema}) =>
    createCMSComponent({schema, tenantId}),
  );
  const components = componentsSettled
    .filter(res => res.status === 'fulfilled')
    .map(res => res.value);

  const failedComponents = componentsSettled.filter(
    res => res.status === 'rejected',
  );

  if (failedComponents.length) {
    console.log('\x1b[31m🔥 Failed:\x1b[0m');
    console.dir(failedComponents, {depth: null});
  }

  const models = getModels(schemas);
  const jsonModelsSettled = await processBatch(models, async model =>
    createMetaJsonModel({model, tenantId}),
  );
  const jsonModels = jsonModelsSettled
    .filter(res => res.status === 'fulfilled')
    .map(res => res.value);

  const failedJsonModels = jsonModelsSettled.filter(
    res => res.status === 'rejected',
  );

  if (failedJsonModels.length) {
    console.log('\x1b[31m🔥 Failed:\x1b[0m');
    console.dir(failedJsonModels, {depth: null});
  }

  const selections = getSelections(schemas);
  const selectionsSettled = await processBatch(
    Array.from(selections.values()),
    async selection => {
      const timeStamp = new Date();
      const name = getCommnonSelectionName(selection.name);
      return createMetaSelect({
        tenantId,
        metaSelectData: {
          isCustom: true,
          priority: 20,
          name: name,
          xmlId: name,
          updatedOn: timeStamp,
        },
        metaSelectItemsData: selection.options.map((option, i) => ({
          title: option.title,
          value: String(option.value),
          color: option.color,
          icon: option.icon,
          order: i + 1,
          updatedOn: timeStamp,
        })),
      });
    },
  );

  const failedSelections = selectionsSettled.filter(
    res => res.status === 'rejected',
  );

  if (failedSelections.length) {
    console.log('\x1b[31m🔥 Failed:\x1b[0m');
    console.dir(failedSelections, {depth: null});
  }

  const customModels = await processBatch(models, async model => {
    const jsonModel = jsonModels.find(m => m.name === model.name);
    if (!jsonModel) {
      console.log(`\x1b[31m✖ Model ${model.name} was not created.\x1b[0m`);
      throw new Error(`Model ${model.name} was not created`);
    }
    const fields = await createCustomFields({
      model: JSON_MODEL,
      uniqueModel: `${JSON_MODEL} ${model.name}`,
      modelField: JSON_MODEL_ATTRS,
      fields: model.fields,
      jsonModel,
      tenantId,
      addPanel: true,
      selections,
    });
    return {...jsonModel, fields};
  });

  const fields = getContentFields(schemas, components);
  // NOTE: json models should be created before fields since target models are referenced in fields by name
  const contentFields = await createCustomFields({
    model: CONTENT_MODEL,
    uniqueModel: CONTENT_MODEL,
    modelField: CONTENT_MODEL_ATTRS,
    fields,
    tenantId,
    addPanel: true,
    selections,
  });

  return {
    components: componentsSettled,
    contentFields,
    customModels,
    selections: selectionsSettled,
  };
}

export async function resetFields(tenantId: Tenant['id']) {
  await Promise.all([
    deleteCustomFields({
      model: CONTENT_MODEL,
      modelField: CONTENT_MODEL_ATTRS,
      tenantId,
    }),
    deleteCustomFields({
      model: JSON_MODEL,
      modelField: JSON_MODEL_ATTRS,
      jsonModelPrefix: CUSTOM_MODEL_PREFIX,
      tenantId,
    }),
  ]);

  await deleteMetaJsonModels({
    jsonModelPrefix: CUSTOM_MODEL_PREFIX,
    tenantId,
  });

  await deleteMetaSelects({tenantId});
}

export async function seedContents(tenantId: Tenant['id']) {
  const _schemas = metas.map(demo => demo.schema);
  if (!validateSchemas(_schemas)) {
    throw new Error('\x1b[31m✖ Invalid schema.\x1b[0m');
  }

  const fileCache = new Cache<Promise<{id: string}>>();
  const res = await processBatch(metas, async ({schema, demos}) => {
    return await createCMSContent({
      tenantId,
      schema: formatSchema(schema),
      demos: demos as Demo<TemplateSchema>[],
      fileCache,
    });
  });
  return res;
}
