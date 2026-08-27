'use client';

import React, {useCallback, useMemo} from 'react';

import {i18n} from '@/locale';
import {Dialog, DialogContent, DialogTitle} from '@/ui/components';
import type {Field, Panel} from '@/ui/form';
import {FormView} from '@/ui/form';

export const AdditionPopup = ({
  style,
  visible = false,
  onClose,
  creationContent,
}: {
  style?: React.CSSProperties;
  visible?: boolean;
  onClose: () => void;
  creationContent: {
    fields: Field[];
    panels?: Panel[];
    handleCreate: (data: any) => void;
  };
}) => {
  const {fields, panels, handleCreate} = useMemo(
    () => creationContent,
    [creationContent],
  );

  const handleRowCreation = useCallback(
    async (values: any) => {
      handleCreate(values);

      onClose();
    },
    [handleCreate, onClose],
  );

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent
        style={style}
        // The title says all there is to say; the rest of the dialog is a form.
        aria-describedby={undefined}
        className="flex flex-col self-center items-center max-h-[80%] max-w-[50rem] px-0 py-4">
        <DialogTitle>{i18n.t('Create new row')}</DialogTitle>
        <div className="overflow-y-auto">
          <FormView
            className="!my-0"
            fields={fields}
            panels={panels}
            submitTitle={i18n.t('Create')}
            onSubmit={handleRowCreation}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdditionPopup;
