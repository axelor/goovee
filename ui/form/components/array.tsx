'use client';

import React, {ReactNode, useCallback, useMemo} from 'react';
import {MdOutlineDelete} from 'react-icons/md';
import {UseFormReturn} from 'react-hook-form';

import {Button} from '@/ui/components';
import {i18n} from '@/locale';

import type {Field as FieldType} from '../types';
import {createDefaultValues, isField} from '../display.helpers';
import {getFormContent} from '../content.helpers';

export const ArrayComponent = ({
  style,
  form,
  field,
  readonly = false,
  renderItem,
  renderAddMore,
  subItemTitle,
}: {
  style?: any;
  form: UseFormReturn<Record<string, any>, any, undefined>;
  field: FieldType;
  readonly?: boolean;
  renderItem: (item: any, name: string) => React.JSX.Element;
  renderAddMore?: ({addItem}: {addItem: () => void}) => ReactNode;
  subItemTitle?: string;
}) => {
  const childrenForm = useMemo(
    () => getFormContent(field.subSchema ?? []),
    [field],
  );

  const childrenDefaultValue = useMemo(
    () => createDefaultValues(field.subSchema ?? []),
    [field],
  );

  const addItem = useCallback(() => {
    const _current = form.getValues(field.name) ?? [];

    form.setValue(field.name, [
      ..._current,
      {
        ...childrenDefaultValue,
        valueId: _current.length,
        fromParticipant: false,
      },
    ]);
  }, [form, field.name, childrenDefaultValue]);

  const removeItem = useCallback(
    (_valueId: any) => {
      const _current = form.getValues(field.name) ?? [];

      form.setValue(
        field.name,
        _current.filter(({valueId}: any) => valueId !== _valueId),
        {shouldValidate: true},
      );
    },
    [field.name, form],
  );

  const renderArrayItem = useCallback(
    (subField: any, idx: any) => {
      return (
        <div className="border rounded-lg p-4 ">
          {subItemTitle != null && (
            <h3 className="text-lg font-semibold leading-6 tracking-tight mb-2">
              {i18n.t(subItemTitle)} #{idx + 2}
            </h3>
          )}
          <div key={subField.valueId} className="flex gap-6">
            {!readonly && (
              <Button
                onClick={() => removeItem(subField.valueId)}
                type="button"
                size="icon"
                className="bg-destructive-dark/20 hover:bg-destructive-dark/40 w-10 h-10 p-2">
                <MdOutlineDelete className="w-6 h-6 text-destructive-dark" />
              </Button>
            )}
            <div className="space-y-6 w-full">
              {childrenForm
                .map(_i => {
                  if (!isField(_i) || (_i as FieldType).hideIf == null)
                    return _i;

                  return {
                    ..._i,
                    hideIf: (formState: any) =>
                      (_i as FieldType).hideIf?.(
                        formState?.[field.name]?.[subField.valueId],
                      ),
                  };
                })
                .map(_i => renderItem(_i, `${field.name}.${idx}.${_i.name}`))}
            </div>
          </div>
        </div>
      );
    },
    [subItemTitle, readonly, childrenForm, removeItem, renderItem, field.name],
  );

  return (
    <div className="space-y-6" style={style}>
      {(form.watch(field.name) ?? []).map(renderArrayItem)}
      {!readonly && renderAddMore?.({addItem})}
    </div>
  );
};
