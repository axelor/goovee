import fs from 'fs';
import fsPromise from 'fs/promises';
import path from 'path';
import {pipeline, Readable} from 'stream';
import {promisify} from 'util';

import type {
  AOSMetaFile,
  AOSMetaJsonField,
  AOSMetaJsonModel,
  AOSMetaSelect,
  AOSMetaSelectItem,
  AOSMetaView,
  AOSPortalCmsComponent,
  AOSPortalCmsContent,
  AOSPortalCmsContentLine,
  AOSPortalCmsMainWebsite,
  AOSPortalCmsPage,
  AOSPortalCmsSite,
} from '@/goovee/.generated/models';
import {manager, type Tenant} from '@/lib/core/tenant';
import {getFileSizeText} from '@/utils/files';
import {xml} from '@/utils/template-string';
import type {CreateArgs, SelectArg} from '@goovee/orm';
import {startCase} from 'lodash-es';
import {JSON_MODEL_ATTRS, WidgetAttrsMap} from '../constants';
import {metaFileModel} from '../templates/meta-models';
import type {
  CustomField,
  Field,
  TemplateSchema,
  Model,
  MetaSelection,
  SelectionOption,
  DemoLite,
} from '../types/templates';
import {
  isArrayField,
  isJsonRelationalField,
  isRelationalField,
} from '../utils/templates';
import {
  Cache,
  collectUniqueModels,
  formatCustomFieldName,
} from '../utils/helper';
import {getStoragePath} from '@/storage/index';
import {Website} from '../templates/site';

const pump = promisify(pipeline);

const disableUpdates = false;
const demoFileDirectory = '/public';
const FILE_PREFIX = 'goovee-template-file';
const SELECT_PREFIX = 'goovee-template-select';
function getContentTitle({
  code,
  language,
  page,
  sequence,
  skipCasingCode,
}: {
  code: string;
  language: string;
  page: string;
  sequence: number;
  skipCasingCode?: boolean;
}) {
  const _code = skipCasingCode ? code : startCase(code);
  return `Demo - ${_code} - ${language} - ${page} - ${sequence}`;
}

export function getCommnonSelectionName(name: string) {
  return `${SELECT_PREFIX}-${name}`;
}

function generateSelectionText(options: readonly SelectionOption[]) {
  return options
    .map(
      item =>
        `${item.value}:${item.title}` +
        '\n' +
        (item.color ? `color:${item.color}` + '\n' : '') +
        (item.icon ? `icon:${item.icon}` + '\n' : ''),
    )
    .join('\n');
}

export async function createCustomFields({
  fields,
  model,
  modelField,
  uniqueModel,
  tenantId,
  jsonModel,
  addPanel,
  selections,
}: {
  model: string;
  modelField: string;
  uniqueModel: string;
  fields: CustomField[];
  tenantId: Tenant['id'];
  jsonModel?: {id: string; name?: string};
  addPanel?: boolean;
  selections: Map<string, MetaSelection>;
}) {
  const client = await manager.getClient(tenantId);
  const timeStamp = new Date();

  if (addPanel && fields[0]?.type !== 'panel') {
    fields = [
      {
        name: formatCustomFieldName(`${jsonModel?.name || model}-panel`),
        type: 'panel',
        ...(!jsonModel?.id && {widgetAttrs: {colSpan: '12'}}),
      },
      ...fields,
    ];
  }

  const res = await Promise.all(
    fields.map(async (field, i) => {
      const isJsonRelational = isJsonRelationalField(field);
      const isRelational = isRelationalField(field);
      const _field = await client.aOSMetaJsonField.findOne({
        where: {
          name: field.name,
          model,
          modelField,
          ...(jsonModel && {jsonModel: {id: jsonModel.id}}),
        },
        select: {id: true, name: true},
      });

      let selectionText: string | undefined;
      let selection: string | undefined;
      let metaSelectData: CreateArgs<AOSMetaSelect> | undefined;
      let metaSelectItemsData: CreateArgs<AOSMetaSelectItem>[] | undefined;

      if ('selection' in field) {
        let name;
        if (Array.isArray(field.selection) && field.selection?.length) {
          name = `${SELECT_PREFIX}-${field.name}-${jsonModel?.name || model}`;
          metaSelectData = {
            isCustom: true,
            priority: 20,
            name: name,
            xmlId: name,
            updatedOn: timeStamp,
          };

          metaSelectItemsData = field.selection.map((item, i) => ({
            title: item.title,
            value: String(item.value),
            color: item.color,
            icon: item.icon,
            order: i + 1,
            updatedOn: timeStamp,
          }));

          selectionText = generateSelectionText(field.selection);
        }
        if (typeof field.selection === 'string') {
          name = getCommnonSelectionName(field.selection);
          selectionText = generateSelectionText(
            selections.get(field.selection)?.options || [],
          );
        }

        selection = name;
      }

      const fieldData: CreateArgs<AOSMetaJsonField> = {
        model,
        modelField,
        name: field.name,
        title: field.title,
        type: field.type,
        required: field.required,
        isSelectionField:
          'selection' in field &&
          (!!field.selection?.length || typeof field.selection === 'string'),
        selectionText: selectionText,
        selection: selection,
        sequence: i,
        uniqueModel,
        widgetAttrs: JSON.stringify({
          ...WidgetAttrsMap[field.type],
          ...field.widgetAttrs,
        }),
        ...('defaultValue' in field &&
          field.defaultValue != null && {
            defaultValue: String(field.defaultValue),
          }),
        ...(isRelational && {targetModel: field.target}),
        ...(isJsonRelational && {
          targetJsonModel: {select: {name: field.target}},
        }),
        ...(jsonModel && {jsonModel: {select: {id: jsonModel.id}}}),
        visibleInGrid: 'visibleInGrid' in field ? field.visibleInGrid : false,
        nameField: 'nameField' in field ? field.nameField : false,
        widget: 'widget' in field ? field.widget : undefined,
        contextField: field.contextField,
        contextFieldValue: field.contextFieldValue,
        contextFieldTarget: field.contextFieldTarget,
        contextFieldTargetName: field.contextFieldTargetName,
        contextFieldTitle: field.contextFieldTitle,
        updatedOn: timeStamp,
      };

      if (_field) {
        if (disableUpdates) {
          console.log(
            `\x1b[33m⚠️ Skipped field:${field.name} | ${jsonModel?.name || model}\x1b[0m `,
          );
          return _field;
        }
        const metaField = await client.aOSMetaJsonField.update({
          data: {...fieldData, id: _field.id, version: _field.version},
          select: {id: true, name: true},
        });

        console.log(
          `\x1b[33m⚠️ Updated field:${field.name} | ${jsonModel?.name || model}\x1b[0m `,
        );
        if (metaSelectData && metaSelectItemsData) {
          await createMetaSelect({
            tenantId,
            metaSelectData,
            metaSelectItemsData,
          });
        }
        return metaField;
      }

      const metaField = await client.aOSMetaJsonField.create({
        data: {...fieldData, createdOn: timeStamp},
        select: {id: true, name: true},
      });

      console.log(
        `\x1b[32m✅ Created field: ${field.name} | ${jsonModel?.name || model}\x1b[0m`,
      );

      if (metaSelectData && metaSelectItemsData) {
        await createMetaSelect({
          tenantId,
          metaSelectData,
          metaSelectItemsData,
        });
      }
      return metaField;
    }),
  );

  return res;
}

export async function createMetaSelect({
  tenantId,
  metaSelectData,
  metaSelectItemsData,
}: {
  tenantId: Tenant['id'];
  metaSelectData: CreateArgs<AOSMetaSelect>;
  metaSelectItemsData: CreateArgs<AOSMetaSelectItem>[];
}): Promise<{id: string; name?: string} | undefined> {
  const client = await manager.getClient(tenantId);

  let metaSelect: {id: string; name?: string} | undefined;
  const _metaSelect = await client.aOSMetaSelect.findOne({
    where: {name: metaSelectData.name},
    select: {
      id: true,
      items: {
        select: {id: true, order: true},
        orderBy: {order: 'ASC'},
      } as {select: {id: true; order: true}},
    },
  });
  if (_metaSelect) {
    if (_metaSelect.items?.length) {
      await client.aOSMetaSelectItem.deleteAll({
        where: {select: {id: _metaSelect.id}},
      });
    }
    try {
      metaSelect = await client.aOSMetaSelect.update({
        data: {
          id: _metaSelect.id,
          version: _metaSelect.version,
          items: {
            create: metaSelectItemsData.map(item => ({
              ...item,
              createdOn: item.updatedOn,
            })),
          },
        },
        select: {id: true, name: true},
      });
      console.log(`\x1b[33m⚠️ Updated select: ${metaSelectData.name}\x1b[0m `);
    } catch (error) {
      console.log(
        `\x1b[31m✖ Failed to update metaSelect: ${metaSelectData.name}\x1b[0m`,
      );
      console.log(error);
    }
  } else {
    try {
      metaSelect = await client.aOSMetaSelect.create({
        data: {
          ...metaSelectData,
          createdOn: metaSelectData.updatedOn,
          items: {
            create: metaSelectItemsData.map(item => ({
              ...item,
              createdOn: metaSelectData.updatedOn,
            })),
          },
        },
        select: {id: true, name: true},
      });
      console.log(
        `\x1b[32m✅ Created metaSelect: ${metaSelectData.name}\x1b[0m`,
      );
    } catch (error) {
      console.log(
        `\x1b[31m✖ Failed to create metaSelect: ${metaSelectData.name}\x1b[0m`,
      );

      console.log(error);
    }
  }
  return metaSelect;
}

export async function createMetaJsonModel({
  model,
  tenantId,
}: {
  model: Model;
  tenantId: Tenant['id'];
}) {
  const client = await manager.getClient(tenantId);
  const timeStamp = new Date();

  const nameField = model.fields.find(f => f.nameField)?.name;
  const _model = await client.aOSMetaJsonModel.findOne({
    where: {name: model.name},
    select: {
      id: true,
      name: true,
      formView: {name: true},
      gridView: {name: true},
    },
  });

  const formViewName = `custom-model-${model.name}-form`;
  const gridViewName = `custom-model-${model.name}-grid`;

  const metaModelData: CreateArgs<AOSMetaJsonModel> = {
    name: model.name,
    title: model.title,
    formWidth: 'large',
    nameField: nameField,
    updatedOn: timeStamp,
  };

  const gridViewData: CreateArgs<AOSMetaView> = {
    name: gridViewName,
    type: 'grid',
    title: model.title,
    model: 'com.axelor.meta.db.MetaJsonRecord',
    priority: 20,
    xml: xml`<grid
        name="${gridViewName}"
        title="${model.title}"
        model="com.axelor.meta.db.MetaJsonRecord">
        <field name="${JSON_MODEL_ATTRS}" x-json-model="${model.name}" />
      </grid>`,
    updatedOn: timeStamp,
  };

  const formViewData: CreateArgs<AOSMetaView> = {
    name: formViewName,
    type: 'form',
    title: model.title,
    model: 'com.axelor.meta.db.MetaJsonRecord',
    priority: 20,
    xml: xml`<form
        name="${formViewName}"
        title="${model.title}"
        model="com.axelor.meta.db.MetaJsonRecord"
        onNew="action-json-record-defaults"
        width="large">
        <panel title="Overview" itemSpan="12">
          <field name="${JSON_MODEL_ATTRS}" x-json-model="${model.name}" />
        </panel>
      </form>`,
    updatedOn: timeStamp,
  };

  if (_model) {
    if (disableUpdates) {
      console.log(`\x1b[33m⚠️ Skipped model: ${model.name}\x1b[0m`);
      return _model;
    }
    const metaModel = await client.aOSMetaJsonModel.update({
      data: {
        ...metaModelData,
        id: _model.id,
        version: _model.version,
        formView: {
          ...(_model.formView
            ? {
                update: {
                  ...formViewData,
                  id: _model.formView.id,
                  version: _model.formView.version,
                },
              }
            : {create: {...formViewData, createdOn: timeStamp}}),
        },
        gridView: {
          ...(_model.gridView
            ? {
                update: {
                  ...gridViewData,
                  id: _model.gridView.id,
                  version: _model.gridView.version,
                },
              }
            : {create: {...gridViewData, createdOn: timeStamp}}),
        },
      },
      select: {id: true, name: true},
    });
    console.log(`\x1b[33m⚠️ Updated model: ${model.name}\x1b[0m`);
    return metaModel;
  }

  const metaModel = await client.aOSMetaJsonModel.create({
    data: {
      ...metaModelData,
      createdOn: timeStamp,
      formView: {create: {...formViewData, createdOn: timeStamp}},
      gridView: {create: {...gridViewData, createdOn: timeStamp}},
    },
    select: {
      id: true,
      name: true,
      formView: {name: true},
      gridView: {name: true},
    },
  });
  console.log(`\x1b[32m✅ Created model: ${metaModel.name}\x1b[0m `);
  console.log(
    `\x1b[32m✅ Created views: ${metaModel.formView?.name} | ${metaModel.gridView?.name}\x1b[0m `,
  );
  return metaModel;
}

export async function createCMSComponent({
  schema,
  tenantId,
}: {
  schema: TemplateSchema;
  tenantId: Tenant['id'];
}) {
  const client = await manager.getClient(tenantId);
  const timeStamp = new Date();
  const _component = await client.aOSPortalCmsComponent.findOne({
    where: {code: schema.code},
    select: {id: true, code: true, title: true},
  });
  const componentData: CreateArgs<AOSPortalCmsComponent> = {
    code: schema.code,
    title: schema.title,
    typeSelect: schema.type,
    updatedOn: timeStamp,
  };

  if (_component) {
    if (disableUpdates) {
      console.log(`\x1b[33m⚠️ Skipped component: ${_component.title}\x1b[0m `);
      return _component;
    }
    const component = await client.aOSPortalCmsComponent.update({
      data: {...componentData, id: _component.id, version: _component.version},
      select: {id: true, code: true, title: true},
    });
    console.log(`\x1b[33m⚠️ Updated component: ${_component.title}\x1b[0m `);
    return component;
  }

  const component = await client.aOSPortalCmsComponent.create({
    data: {...componentData, createdOn: timeStamp},
    select: {id: true, code: true, title: true},
  });

  console.log(`\x1b[32m✅ component: ${component.title}\x1b[0m`);
  return component;
}

export async function deleteCustomFields({
  model,
  modelField,
  tenantId,
  jsonModelPrefix,
}: {
  model: string;
  modelField: string;
  jsonModelPrefix?: string;
  tenantId: Tenant['id'];
}) {
  const client = await manager.getClient(tenantId);
  await client.aOSMetaJsonField.deleteAll({
    where: {
      model,
      modelField,
      ...(jsonModelPrefix && {
        jsonModel: {name: {like: jsonModelPrefix + '%'}},
      }),
    },
  });
  if (jsonModelPrefix) {
    console.log(
      `\x1b[32m✅ Deleted fields for the models with prefix: ${jsonModelPrefix} in the modelField: ${modelField}.\x1b[0m`,
    );
  } else {
    console.log(
      `\x1b[32m✅ Deleted all fields for the model: ${model} in the modelField: ${modelField}.\x1b[0m`,
    );
  }
}

export async function deleteMetaJsonModels({
  jsonModelPrefix,
  tenantId,
}: {
  jsonModelPrefix?: string;
  tenantId: Tenant['id'];
}) {
  const client = await manager.getClient(tenantId);
  const models = await client.aOSMetaJsonModel.find({
    where: {
      name: {like: jsonModelPrefix + '%'},
    },
    select: {
      id: true,
      formView: {id: true, name: true},
      gridView: {id: true, name: true},
      name: true,
    },
  });

  await client.aOSMetaJsonModel.deleteAll({
    where: {
      name: {like: jsonModelPrefix + '%'},
    },
  });

  const views = models
    .flatMap(model => [model.formView, model.gridView])
    .filter(Boolean);
  if (views.length) {
    await client.aOSMetaView.deleteAll({
      where: {
        id: {in: views.map(view => view!.id)},
      },
    });
  }

  console.log(
    `\x1b[32m✅  Deleted all models with the prefix ${jsonModelPrefix} and their views.\x1b[0m`,
  );
}

export async function deleteMetaSelects(props: {tenantId: Tenant['id']}) {
  const {tenantId} = props;
  const client = await manager.getClient(tenantId);
  await client.aOSMetaSelectItem.deleteAll({
    where: {select: {name: {like: `${SELECT_PREFIX}%`}}},
  });
  await client.aOSMetaSelect.deleteAll({
    where: {name: {like: `${SELECT_PREFIX}%`}},
  });
  console.log(
    `\x1b[32m✅  Deleted all selects and their items with the prefix ${SELECT_PREFIX}.\x1b[0m`,
  );
}

export async function createCMSContent(props: {
  tenantId: Tenant['id'];
  schema: TemplateSchema;
  demos: DemoLite<TemplateSchema>[];
  fileCache: Cache<Promise<{id: string}>>;
}) {
  const {tenantId, demos, schema, fileCache} = props;

  const client = await manager.getClient(tenantId);
  return await Promise.all(
    demos.map(async demo => {
      const timeStamp = new Date();
      const title = getContentTitle({
        code: schema.code,
        language: demo.language,
        page: demo.page,
        sequence: demo.sequence,
      });

      const _content = await client.aOSPortalCmsContent.findOne({
        where: {
          title,
          component: {code: schema.code},
          language: {code: demo.language},
        },
        select: {id: true, title: true},
      });

      if (disableUpdates && _content) {
        console.log(`\x1b[33m⚠️ Skipped content: ${_content.title}\x1b[0m `);
        return _content;
      }

      //TODO: add support for updating attrs
      const attrs = await createAttrs({
        tenantId,
        schema,
        data: demo.data,
        fields: schema.fields,
        fileCache,
      });

      const contentData: CreateArgs<AOSPortalCmsContent> = {
        language: {select: {code: demo.language}},
        component: {select: {code: schema.code}},
        attrs: attrs as any,
        title,
        updatedOn: timeStamp,
      };

      if (_content) {
        const content = await client.aOSPortalCmsContent.update({
          data: {
            ...contentData,
            id: _content.id,
            version: _content.version,
          },
          select: {id: true, title: true},
        });
        console.log(`\x1b[33m⚠️ Updated content: ${_content.title}\x1b[0m `);
        return content;
      }

      const content = await client.aOSPortalCmsContent.create({
        data: {...contentData, createdOn: timeStamp},
        select: {id: true, title: true},
      });
      console.log(`\x1b[32m✅ Created content: ${content.title}\x1b[0m `);
      return content;
    }),
  );
}

async function createMetaJsonRecord(props: {
  jsonModel: string;
  attrs: any;
  name?: string;
  tenantId: Tenant['id'];
}) {
  const {tenantId, jsonModel, attrs, name} = props;
  const client = await manager.getClient(tenantId);
  const timeStamp = new Date();
  const record = await client.aOSMetaJsonRecord.create({
    data: {jsonModel, attrs, updatedOn: timeStamp, createdOn: timeStamp, name},
    select: {id: true, version: true},
  });

  return record;
}

async function getFileFromPublic(filePath: string) {
  filePath = process.cwd() + `${demoFileDirectory}${filePath}`;
  const file = await fsPromise.readFile(filePath);
  if (!file) {
    console.log(`\x1b[31m✖ File at location ${filePath} not found.\x1b[0m`);
    throw new Error(`File at location ${filePath} not found`);
  }
  return file;
}

async function createMetaFile({
  tenantId,
  originPath,
  metaFilePath,
  fileName,
  fileType,
}: {
  tenantId: Tenant['id'];
  originPath: string;
  metaFilePath: string;
  fileName: string;
  fileType: string;
}): Promise<{id: string}> {
  const client = await manager.getClient(tenantId);

  const buffer = await getFileFromPublic(originPath);
  await pump(
    Readable.from(buffer),
    fs.createWriteStream(path.resolve(getStoragePath(), metaFilePath)),
  );

  const metaFileData: CreateArgs<AOSMetaFile> = {
    fileName,
    filePath: metaFilePath,
    fileType,
    fileSize: buffer.length.toString(),
    sizeText: getFileSizeText(buffer.length),
  };

  const _metaFile = await client.aOSMetaFile.findOne({
    where: {filePath: metaFilePath, fileName, fileType},
    select: {id: true, version: true},
  });

  if (_metaFile) {
    const metaFile = await client.aOSMetaFile.update({
      data: {
        ...metaFileData,
        id: _metaFile.id,
        version: _metaFile.version,
      },
      select: {id: true, version: true},
    });
    console.log(`\x1b[33m⚠️ Updated metaFile: ${fileName}\x1b[0m `);
    return metaFile;
  }

  const metaFile = await client.aOSMetaFile.create({
    data: metaFileData,
    select: {id: true, version: true},
  });

  console.log(`\x1b[32m✅ Created metaFile: ${fileName}\x1b[0m `);
  return metaFile;
}

async function getMetaFile({
  tenantId,
  fileName,
  fileType,
  filePath: originPath,
  fileCache,
}: {
  fileName: string;
  fileType: string;
  tenantId: Tenant['id'];
  filePath: string;
  fileCache: Cache<Promise<{id: string}>>;
}) {
  try {
    const metaFilePath = `${FILE_PREFIX}-${fileName}`;
    const fileCacheKey = `${metaFilePath}-${fileType}-${fileName}`;

    const cachedMetaFile = await fileCache.get(fileCacheKey);
    if (cachedMetaFile) return cachedMetaFile;

    //NOTE: FileCache is used to avoid copying the same file multiple times in the given seeding process
    const metaFilePromise = createMetaFile({
      tenantId,
      originPath,
      metaFilePath,
      fileName,
      fileType,
    });

    fileCache.set(fileCacheKey, metaFilePromise);
    return metaFilePromise;
  } catch (error) {
    console.log(`\x1b[31m✖ Failed to create meta file: ${fileName}\x1b[0m`);
    throw new Error('Failed to create meta file');
  }
}

async function createAttrs(props: {
  tenantId: Tenant['id'];
  schema: TemplateSchema;
  fields: Field[];
  data: any;
  fileCache: Cache<Promise<{id: string}>>;
}) {
  const {tenantId, fields, schema, data, fileCache} = props;
  const {attrs, fieldsMap} = fields.reduce<{
    attrs: Record<string, any>;
    fieldsMap: Map<string, Field>;
  }>(
    (acc, field) => {
      acc.fieldsMap.set(field.name, field);
      if ('defaultValue' in field && field.defaultValue != null) {
        acc.attrs[field.name] = field.defaultValue;
      }
      return acc;
    },
    {attrs: {}, fieldsMap: new Map()},
  );

  const models = collectUniqueModels(schema);
  await Promise.all(
    Object.entries(data || {}).map(async ([key, value]: [string, any]) => {
      const field = fieldsMap.get(key);
      if (!field) return;
      if (isJsonRelationalField(field)) {
        const modelFields = models.get(field.target)!.fields;

        const nameField = modelFields.find(f => f.nameField)?.name;
        if (isArrayField(field)) {
          const metaJsonRecords = await Promise.all(
            value.map(async (record: any) => {
              return createMetaJsonRecord({
                name: nameField && record.attrs?.[nameField],
                jsonModel: field.target,
                attrs: await createAttrs({
                  tenantId,
                  schema,
                  fields: modelFields,
                  data: record.attrs,
                  fileCache,
                }),
                tenantId,
              });
            }),
          );
          attrs[key] = metaJsonRecords.map(r => ({
            id: Number(r.id),
          }));
        } else {
          const metaJsonRecord = await createMetaJsonRecord({
            jsonModel: field.target,
            name: nameField && value.attrs?.[nameField],
            attrs: await createAttrs({
              tenantId,
              fields: modelFields,
              schema,
              data: value.attrs,
              fileCache,
            }),
            tenantId,
          });
          attrs[key] = {id: Number(metaJsonRecord.id)};
        }
        return;
      } else if (isRelationalField(field)) {
        if (field.target !== metaFileModel.name) {
          console.log(
            `\x1b[31m✖ Skipped field: ${field.title} in ${schema.title} Creating content is only supported for metaFileModel for relational fields\x1b[0m`,
          );
          return;
        }

        if (isArrayField(field)) {
          const records = await Promise.all(
            value.map(async (record: any) => {
              return await getMetaFile({
                fileName: record.fileName,
                fileType: record.fileType,
                filePath: record.filePath,
                tenantId,
                fileCache,
              });
            }),
          );
          attrs[key] = records.map(r => ({id: Number(r.id)}));
        } else {
          const record = await getMetaFile({
            fileName: value.fileName,
            fileType: value.fileType,
            filePath: value.filePath,
            tenantId,
            fileCache,
          });
          attrs[key] = {id: Number(record.id)};
        }
      } else {
        attrs[key] = value;
      }
    }),
  );
  return attrs;
}

export async function createCMSPage(props: {
  tenantId: Tenant['id'];
  page: string;
  language: string;
  siteId: string;
  demos: DemoLite<TemplateSchema>[];
  title: string;
}) {
  const {tenantId, siteId, page, language, demos, title} = props;
  const client = await manager.getClient(tenantId);
  const timeStamp = new Date();

  const cmsPageFields = {
    id: true,
    title: true,
    website: {id: true},
    slug: true,
    language: {code: true},
  } satisfies SelectArg<AOSPortalCmsPage>;

  const _cmsPage = await client.aOSPortalCmsPage.findOne({
    where: {
      website: {id: siteId},
      slug: page,
      title: title,
      language: {code: language},
    },
    select: {
      ...cmsPageFields,
      contentLines: {select: {id: true}},
    },
  });

  const contentLines: CreateArgs<AOSPortalCmsContentLine>[] = demos.map(
    demo => ({
      sequence: demo.sequence,
      language: {select: {code: language}},
      content: {
        select: {
          title: {
            like: getContentTitle({
              code: '%',
              language,
              page,
              sequence: demo.sequence,
              skipCasingCode: true,
            }),
          },
        },
      },
    }),
  );

  const pageData: CreateArgs<AOSPortalCmsPage> = {
    statusSelect: '1',
    language: {select: {code: language}},
    title,
    slug: page,
    updatedOn: timeStamp,
    website: {select: {id: siteId}},
  };

  if (_cmsPage) {
    if (disableUpdates) {
      console.log(`\x1b[33m⚠️ Skipped page: ${_cmsPage.title}\x1b[0m `);
      return _cmsPage;
    }

    await client.aOSPortalCmsContentLine.deleteAll({
      where: {
        page: {id: _cmsPage.id},
      },
    });

    const cmsPage = await client.aOSPortalCmsPage.update({
      data: {
        ...pageData,
        contentLines: {
          create: contentLines,
        },
        id: _cmsPage.id,
        version: _cmsPage.version,
      },
      select: cmsPageFields,
    });

    console.log(`\x1b[33m⚠️ Updated page: ${_cmsPage.title}\x1b[0m `);
    return cmsPage;
  }

  const cmsPage = await client.aOSPortalCmsPage.create({
    data: {
      ...pageData,
      contentLines: {create: contentLines},
      createdOn: timeStamp,
    },
    select: cmsPageFields,
  });
  console.log(`\x1b[32m✅ Created page: ${cmsPage.title}\x1b[0m `);
  return cmsPage;
}

export async function createCMSWebsite(props: {
  tenantId: Tenant['id'];
  website: Website;
}) {
  const {tenantId, website} = props;
  const client = await manager.getClient(tenantId);
  const timeStamp = new Date();
  const _mainWebsite = await client.aOSPortalCmsMainWebsite.findOne({
    where: {
      name: website.name,
    },
    select: {
      id: true,
      name: true,
    },
  });

  const websiteData: CreateArgs<AOSPortalCmsMainWebsite> = {
    name: website.name,
    updatedOn: timeStamp,
  };
  let mainWebsite;
  if (_mainWebsite) {
    mainWebsite = await client.aOSPortalCmsMainWebsite.update({
      data: {
        ...websiteData,
        id: _mainWebsite.id,
        version: _mainWebsite.version,
      },
    });
    await client.aOSPortalCmsSiteLanguage.deleteAll({
      where: {
        mainWebsite: {
          id: _mainWebsite.id,
        },
      },
    });
  } else {
    mainWebsite = await client.aOSPortalCmsMainWebsite.create({
      data: {
        ...websiteData,
        createdOn: timeStamp,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  const cmsSites = await createCMSSites({
    tenantId,
    website,
    mainWebsiteId: mainWebsite.id,
  });

  const defaultSiteSlug = website.sites.find(site => site.website.isDefault)
    ?.website?.slug;

  await client.aOSPortalCmsMainWebsite.update({
    data: {
      id: mainWebsite.id,
      version: mainWebsite.version,
      ...(defaultSiteSlug && {
        defaultWebsite: {
          select: {mainWebsite: {id: mainWebsite.id}, slug: defaultSiteSlug},
        },
      }),
      languageList: {
        create: website.sites.map(site => ({
          language: {
            select: {
              code: site.language,
            },
          },
          website: {
            select: {
              id: cmsSites.find(s => s.slug === site.website.slug)?.id,
            },
          },
        })),
      },
    },
  });

  if (_mainWebsite) {
    console.log(`\x1b[33m⚠️ Updated website: ${_mainWebsite.name}\x1b[0m `);
  } else {
    console.log(`\x1b[32m✅ Created website: ${mainWebsite.name}\x1b[0m `);
  }
  return {
    mainWebsite,
    sites: cmsSites,
  };
}

export async function createCMSSites(props: {
  tenantId: Tenant['id'];
  website: Website;
  mainWebsiteId: string;
}) {
  const {tenantId, website, mainWebsiteId} = props;
  const client = await manager.getClient(tenantId);
  const timeStamp = new Date();
  const cmsSites = await Promise.all(
    website.sites.map(async site => {
      const _cmsSite = await client.aOSPortalCmsSite.findOne({
        where: {mainWebsite: {id: mainWebsiteId}, slug: site.website.slug},
        select: {id: true, name: true, slug: true},
      });
      const siteData: CreateArgs<AOSPortalCmsSite> = {
        mainWebsite: {select: {id: mainWebsiteId}},
        name: site.website.name,
        slug: site.website.slug,
        isPrivate: false,
        isGuestUserAllow: site.website.isGuestUserAllow,
        updatedOn: timeStamp,
      };

      if (_cmsSite) {
        if (disableUpdates) {
          console.log(`\x1b[33m⚠️ Skipped site: ${_cmsSite.name}\x1b[0m `);
          return _cmsSite;
        }
        const cmsSite = await client.aOSPortalCmsSite.update({
          data: {...siteData, id: _cmsSite.id, version: _cmsSite.version},
          select: {id: true, name: true, slug: true},
        });
        console.log(`\x1b[33m⚠️ Updated site: ${_cmsSite.name}\x1b[0m `);
        return cmsSite;
      }
      const cmsSite = await client.aOSPortalCmsSite.create({
        data: {...siteData, createdOn: timeStamp},
        select: {id: true, name: true, slug: true},
      });
      console.log(`\x1b[32m✅ Created site: ${cmsSite.name}\x1b[0m `);
      return cmsSite;
    }),
  );
  return cmsSites;
}

export async function updateHomepage(props: {
  tenantId: Tenant['id'];
  siteId: string;
  siteVersion: number;
  pageId: string;
}) {
  const {tenantId, siteId, siteVersion, pageId} = props;
  const client = await manager.getClient(tenantId);
  const timeStamp = new Date();

  const site = await client.aOSPortalCmsSite.update({
    data: {
      id: siteId,
      version: siteVersion,
      homepage: {select: {id: pageId}},
      updatedOn: timeStamp,
    },
    select: {id: true},
  });

  return site;
}

export async function replacePageSet(props: {
  tenantId: Tenant['id'];
  pageId: string;
  pageVersion: number;
  pageSetIds: string[];
}) {
  const {tenantId, pageId, pageVersion, pageSetIds: pageSetIds} = props;
  const client = await manager.getClient(tenantId);

  const _page = await client.aOSPortalCmsPage.findOne({
    where: {id: pageId},
    select: {id: true, pageSet: {select: {id: true}}},
  });

  if (!_page) {
    throw new Error(`Page ${pageId} not found`);
  }

  const existingPageSetIds = _page.pageSet?.map(page => page.id);
  const pageSetIdsToRemove = existingPageSetIds?.filter(
    id => !pageSetIds.includes(id),
  );

  const page = await client.aOSPortalCmsPage.update({
    data: {
      id: pageId,
      version: pageVersion,
      pageSet: {
        ...(pageSetIdsToRemove?.length && {
          remove: pageSetIdsToRemove,
        }),
        select: pageSetIds.map(id => ({id})),
      },
    },
    select: {id: true},
  });

  return page;
}
