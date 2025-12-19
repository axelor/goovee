import React, {useCallback, useMemo} from 'react';
import {ControllerRenderProps, UseFormReturn} from 'react-hook-form';

import {i18n} from '@/locale';
import {
  Checkbox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  RichTextEditor,
} from '@/ui/components';

import {InputType, WidgetType, type Field as FieldType} from '../types';
import {getColspan, mapFieldType} from '../display.helpers';
import {FormGridComponent} from './grid';
import {SelectionPicker} from './selection-picker';
import {ObjectPicker} from './object-picker';

export const FieldComponent = ({
  item,
  form,
  identifier = '',
  globalReadonly = false,
  renderItem,
}: {
  item: FieldType;
  form: UseFormReturn<Record<string, any>, any, undefined>;
  identifier: string;
  globalReadonly?: boolean;
  renderItem: (item: any, name: string) => React.JSX.Element;
}) => {
  const formState = form.watch();

  const isHidden = useMemo(() => {
    return item.hidden || item.hideIf?.(formState);
  }, [item, formState]);

  const isRequired = useMemo(() => {
    return item.required || item.requiredIf?.(formState);
  }, [item, formState]);

  const isReadonly = useMemo(() => {
    return globalReadonly || item.readonly;
  }, [globalReadonly, item]);

  const widthStyle = useMemo(
    () => ({width: `${getColspan(item.colSpan)}%`}),
    [item.colSpan],
  );

  const Wrapper = useCallback(
    ({children, className = ''}: {children: any; className?: string}) => {
      return (
        <FormItem
          className={`min-w-[150px] flex-grow p-1 ${className}`}
          style={widthStyle}>
          {children}
        </FormItem>
      );
    },
    [widthStyle],
  );

  const renderComponent = useCallback(
    ({field}: {field: ControllerRenderProps<any, any>}): React.ReactElement<any> => {
      if (item.widget === WidgetType.custom) {
        return React.createElement(item.customComponent as any, {
          style: widthStyle,
          form,
          field: item,
          formKey: identifier,
          readonly: isReadonly,
          renderItem,
        });
      }

      if (item.widget === WidgetType.select) {
        return (
          <Wrapper>
            <FormLabel className="text-base font-medium leading-6">
              {i18n.t(item.title ?? '')}
              {isRequired && <span className="text-destructive ms-1">*</span>}
            </FormLabel>
            <SelectionPicker
              form={form}
              field={item}
              formKey={identifier}
              readonly={isReadonly}
              {...item.options}
            />
            <FormMessage />
          </Wrapper>
        );
      }

      if (item.type === InputType.array) {
        return (
          <Wrapper>
            <FormGridComponent
              form={form}
              item={item}
              identifier={identifier}
              readonly={isReadonly}
              {...item.options}
            />
          </Wrapper>
        );
      }

      if (item.type === InputType.object) {
        return (
          <Wrapper>
            <FormLabel className="text-base font-medium leading-6">
              {i18n.t(item.title ?? '')}
              {isRequired && <span className="text-destructive ms-1">*</span>}
            </FormLabel>
            <ObjectPicker
              form={form}
              field={item}
              formKey={identifier}
              readonly={isReadonly}
              {...item.options}
            />
            <FormMessage />
          </Wrapper>
        );
      }

      if (item.type === InputType.boolean) {
        return (
          <Wrapper className="my-2 flex items-center gap-3">
            <FormControl>
              <Checkbox
                checked={form.watch(identifier)}
                onCheckedChange={() =>
                  form.setValue(identifier, !form.watch(identifier), {
                    shouldValidate: true,
                  })
                }
                required={isRequired}
                disabled={isReadonly}
              />
            </FormControl>
            <FormLabel
              className="text-md font-normal cursor-pointer"
              style={{margin: 0}}>
              {i18n.t(item.title ?? '')}
              {isRequired && <span className="text-destructive ms-1">*</span>}
            </FormLabel>
          </Wrapper>
        );
      }

      if (item.type === InputType.string && item.widget === WidgetType.html) {
        return (
          <Wrapper>
            <FormLabel className="text-base font-medium leading-6">
              {i18n.t(item.title ?? '')}
              {isRequired && <span className="text-destructive ms-1">*</span>}
            </FormLabel>
            <FormControl>
              <RichTextEditor
                onChange={field.onChange}
                content={form.watch(identifier)}
                disabled={isReadonly}
                classNames={{
                  wrapperClassName: 'overflow-visible bg-card',
                  toolbarClassName: 'mt-0',
                  editorClassName: 'px-4',
                }}
              />
            </FormControl>
            <FormMessage />
          </Wrapper>
        );
      }

      if (item.type === InputType.string || item.type === InputType.number) {
        return (
          <Wrapper>
            <FormLabel className="text-base font-medium leading-6">
              {i18n.t(item.title ?? '')}
              {isRequired && <span className="text-destructive ms-1">*</span>}
            </FormLabel>
            <FormControl>
              <Input
                className="py-3 px-4 rounded-lg focus-visible:ring-offset-0 focus-visible:ring-0 text-main-black dark:text-white placeholder:text-sm placeholder:font-normal h-[2.875rem] border text-sm font-normal"
                type={mapFieldType(item)}
                placeholder={item.helper}
                {...field}
                required={isRequired}
                disabled={isReadonly}
              />
            </FormControl>
            <FormMessage />
          </Wrapper>
        );
      }

      return null as any;
    },
    [
      Wrapper,
      form,
      identifier,
      isReadonly,
      isRequired,
      item,
      renderItem,
      widthStyle,
    ],
  );

  if (isHidden) {
    return null;
  }

  return (
    <FormField
      key={identifier}
      control={form.control}
      name={identifier}
      render={renderComponent}
    />
  );
};
