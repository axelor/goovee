import {
  DEFAULT_COLSPAN,
  type DisplayPanel,
  type Field as FieldType,
  type Panel as PanelType,
} from './types';

const sortContent = (
  items: (DisplayPanel | FieldType)[],
): (DisplayPanel | FieldType)[] => {
  return items
    .map((_i, idx) => ({
      ..._i,
      colSpan: _i.colSpan ?? DEFAULT_COLSPAN,
      order: _i.order ?? idx * 10,
    }))
    .sort((a, b) => a.order - b.order);
};

const getContentOfPanel = (
  panelKey: string,
  fields: FieldType[],
  panels: PanelType[],
): (DisplayPanel | FieldType)[] => {
  if (fields.length === 0) {
    return [];
  }

  const result: (DisplayPanel | FieldType)[] = fields.filter(
    _item => _item.parent === panelKey,
  );

  if (panels.length === 0) {
    return result;
  }

  panels
    .filter(_item => _item.parent === panelKey)
    .forEach(_item => {
      result.push({
        ..._item,
        content: getContentOfPanel(
          _item.name,
          fields.filter(_field => _field.parent !== panelKey),
          panels.filter(_panel => _panel.parent !== panelKey),
        ),
      });
    });

  return sortContent(result);
};

export const getFormContent = (
  fields: FieldType[],
  panels?: PanelType[],
): (DisplayPanel | FieldType)[] => {
  if (!Array.isArray(panels) || panels.length === 0) {
    return sortContent(fields);
  }

  const rootPanels = panels.filter(_item => _item.parent == null);

  if (rootPanels.length === 0) {
    return fields;
  }

  const result: (DisplayPanel | FieldType)[] = fields.filter(
    _item => _item.parent == null,
  );

  rootPanels.forEach(_panel => {
    result.push({
      ..._panel,
      content: getContentOfPanel(_panel.name, fields, panels),
    });
  });

  return sortContent(result);
};
