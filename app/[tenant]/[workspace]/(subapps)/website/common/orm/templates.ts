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
} from '@/goovee/.generated/models';
import {manager, type Tenant} from '@/lib/core/tenant';
import {getFileSizeText} from '@/utils/files';
import {xml} from '@/utils/template-string';
import type {CreateArgs} from '@goovee/orm';
import {startCase} from 'lodash-es';
import {JSON_MODEL_ATTRS, WidgetAttrsMap} from '../constants';
import {metaFileModel} from '../templates/meta-models';
import type {
  CustomField,
  Demo,
  Field,
  TemplateSchema,
  Model,
} from '../types/templates';
import {
  isArrayField,
  isJsonRelationalField,
  isRelationalField,
} from '../utils/templates';
import {Cache, formatCustomFieldName} from '../utils/helper';

const pump = promisify(pipeline);

/** seeding  variables **/
const storage = process.env.DATA_STORAGE as string;
const disableUpdates = false;
const enableMetaSelect = true;
const demoFileDirectory = '/public';
const FILE_PREFIX = 'goovee-template-file';
function getContentTitle({code, language}: {code: string; language: string}) {
  return `Demo - ${startCase(code)} - ${language}`;
}

if (!fs.existsSync(storage)) {
  fs.mkdirSync(storage, {recursive: true});
}

export async function createCustomFields({
  fields,
  model,
  modelField,
  uniqueModel,
  tenantId,
  jsonModel,
  addPanel,
}: {
  model: string;
  modelField: string;
  uniqueModel: string;
  fields: CustomField[];
  tenantId: Tenant['id'];
  jsonModel?: {id: string; name?: string};
  addPanel?: boolean;
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

      if ('selection' in field && field.selection?.length) {
        const name = `goovee-template-select-${field.name}-${jsonModel?.name || model}`;
        if (enableMetaSelect) {
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

          selection = name;
        }
        selectionText = field.selection
          .map(
            item =>
              `${item.value}:${item.title}` +
              '\n' +
              (item.color ? `color:${item.color}` + '\n' : '') +
              (item.icon ? `icon:${item.icon}` + '\n' : ''),
          )
          .join('\n');
      }

      const fieldData: CreateArgs<AOSMetaJsonField> = {
        model,
        modelField,
        name: field.name,
        title: field.title,
        type: field.type,
        required: field.required,
        isSelectionField: 'selection' in field && !!field.selection?.length,
        selectionText: selectionText,
        selection: selection,
        sequence: i,
        uniqueModel,
        widgetAttrs: JSON.stringify({
          ...WidgetAttrsMap[field.type],
          ...field.widgetAttrs,
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
        if (metaSelectData && metaSelectItemsData && enableMetaSelect) {
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
            const existingItemsLength = _metaSelect.items?.length || 0;
            const currentItemsLength = metaSelectItemsData.length;
            try {
              await client.aOSMetaSelect.update({
                data: {
                  id: _metaSelect.id,
                  version: _metaSelect.version,
                  items: {
                    update: existingItemsLength
                      ? _metaSelect.items?.map((item, i) => ({
                          ...metaSelectItemsData[i],
                          id: item.id,
                          version: item.version,
                        }))
                      : undefined,
                    create:
                      existingItemsLength < currentItemsLength
                        ? metaSelectItemsData
                            .slice(existingItemsLength)
                            .map(item => ({
                              ...item,
                              createdOn: timeStamp,
                            }))
                        : undefined,
                    remove:
                      existingItemsLength > currentItemsLength
                        ? _metaSelect.items
                            ?.slice(currentItemsLength)
                            .map(item => item.id)
                        : undefined,
                  },
                },
                select: {id: true, name: true},
              });
              console.log(
                `\x1b[33m⚠️ Updated select: ${metaSelectData.name}\x1b[0m `,
              );
            } catch (error) {
              console.log(
                `\x1b[31m✖ Failed to update metaSelect: ${metaSelectData.name}\x1b[0m`,
              );
              console.log(error);
            }
          } else {
            await createMetaSelect({
              tenantId,
              metaSelectData,
              metaSelectItemsData,
            });
          }
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

      if (metaSelectData && metaSelectItemsData && enableMetaSelect) {
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

async function createMetaSelect({
  tenantId,
  metaSelectData,
  metaSelectItemsData,
}: {
  tenantId: Tenant['id'];
  metaSelectData: CreateArgs<AOSMetaSelect>;
  metaSelectItemsData: CreateArgs<AOSMetaSelectItem>[];
}) {
  const client = await manager.getClient(tenantId);

  try {
    const metaSelect = await client.aOSMetaSelect.create({
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
    console.log(`\x1b[32m✔ Created metaSelect: ${metaSelectData.name}\x1b[0m`);
  } catch (error) {
    console.log(
      `\x1b[31m✖ Failed to create metaSelect: ${metaSelectData.name}\x1b[0m`,
    );

    console.log(error);
  }
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
  const fields = await client.aOSMetaJsonField.find({
    where: {
      model,
      modelField,
      ...(jsonModelPrefix && {
        jsonModel: {name: {like: jsonModelPrefix + '%'}},
      }),
    },
    select: {id: true, name: true, selection: true, jsonModel: {name: true}},
  });

  await Promise.all(
    fields.map(async field => {
      await client.aOSMetaJsonField.delete({
        id: field.id,
        version: field.version,
      });
      console.log(
        `\x1b[31m✖ field:${field.name} | ${field.jsonModel?.name || model}.\x1b[0m`,
      );
      if (field.selection && enableMetaSelect) {
        const metaSelect = await client.aOSMetaSelect.findOne({
          where: {name: field.selection},
          select: {id: true, items: {select: {id: true}}},
        });
        if (metaSelect) {
          if (metaSelect.items?.length) {
            await Promise.all(
              metaSelect.items.map(item =>
                client.aOSMetaSelectItem.delete({
                  id: item.id,
                  version: item.version,
                }),
              ),
            );
          }
          await client.aOSMetaSelect.delete({
            id: metaSelect.id,
            version: metaSelect.version,
          });
          console.log(`\x1b[31m✖ metaSelect:${field.selection}.\x1b[0m`);
        }
      }
    }),
  );
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

  await Promise.all(
    models.map(async model => {
      await client.aOSMetaJsonModel.delete({
        id: model.id,
        version: model.version,
      });
      console.log(`\x1b[31m✖ model:${model.name}.\x1b[0m`);
    }),
  );

  await Promise.all(
    models.map(async model => {
      let formView, gridView;
      if (model.formView) {
        formView = client.aOSMetaView.delete({
          id: model.formView.id,
          version: model.formView.version,
        });
      }
      if (model.gridView) {
        gridView = client.aOSMetaView.delete({
          id: model.gridView.id,
          version: model.gridView.version,
        });
      }
      await formView;
      await gridView;

      console.log(
        `\x1b[31m✖ view:${model.formView?.name} | ${model.gridView?.name}.\x1b[0m`,
      );
    }),
  );
}

export async function createCMSContent(props: {
  tenantId: Tenant['id'];
  schema: TemplateSchema;
  demos: Demo<TemplateSchema>[];
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
  tenantId: Tenant['id'];
}) {
  const {tenantId, jsonModel, attrs} = props;
  const client = await manager.getClient(tenantId);
  const timeStamp = new Date();
  const record = await client.aOSMetaJsonRecord.create({
    data: {jsonModel, attrs, updatedOn: timeStamp, createdOn: timeStamp},
    select: {id: true, version: true},
  });

  return record;
}

async function getFileFromPublic(filePath: string) {
  filePath = process.cwd() + `${demoFileDirectory}${filePath}`;
  const file = await fsPromise.readFile(filePath);
  if (!file) {
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
    fs.createWriteStream(path.resolve(storage, metaFilePath)),
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
  const attrs: Record<string, any> = {};
  const {tenantId, fields, schema, data, fileCache} = props;
  await Promise.all(
    Object.entries(data || {}).map(async ([key, value]: [string, any]) => {
      const field = fields.find(f => f.name === key);
      if (!field) return;
      if (isJsonRelationalField(field)) {
        const modelFields = schema.models!.find(
          m => m.name === field.target,
        )!.fields;
        if (isArrayField(field)) {
          const metaJsonRecords = await Promise.all(
            value.map(async (record: any) => {
              return createMetaJsonRecord({
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
