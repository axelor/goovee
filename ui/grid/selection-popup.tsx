'use client';

import React, {useCallback, useMemo, useState} from 'react';

import {i18n} from '@/locale';
import {Button, Dialog, DialogContent, DialogTitle} from '@/ui/components';

import GridView from './grid-view';
import {Column} from './types';
import {selectRecord} from './content.helpers';

export const SelectionPopup = ({
  style,
  visible = false,
  onClose,
  selectionContent,
}: {
  style?: React.CSSProperties;
  visible?: boolean;
  onClose: () => void;
  selectionContent: {
    columns: Partial<Column>[];
    data: any[];
    handleSelect: (records: any[]) => void;
  };
}) => {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const {columns, data, handleSelect} = useMemo(
    () => selectionContent,
    [selectionContent],
  );

  const handleClose = useCallback(() => {
    setSelectedRows([]);

    onClose();
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    handleSelect(selectedRows);
    handleClose();
  }, [handleClose, handleSelect, selectedRows]);

  const handleRowSelection = useCallback((record: any) => {
    setSelectedRows(_current => selectRecord(_current, record));
  }, []);

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent
        style={style}
        // The title says all there is to say; the rest of the dialog is a grid.
        aria-describedby={undefined}
        className="flex flex-col self-center items-center max-h-[80%] max-w-[50rem] px-10 py-4">
        <DialogTitle>{i18n.t('Select a record')}</DialogTitle>
        <div className="overflow-y-auto">
          <GridView
            style={{margin: 0, padding: 0}}
            columns={columns}
            data={data}
            handleRowClick={handleRowSelection}
            selectedRows={selectedRows.map(({id}: any) => id)}
          />
        </div>
        <Button
          variant="success"
          className="text-base font-medium leading-6 p-3 w-full"
          onClick={e => {
            e.preventDefault();
            handleConfirm();
          }}
          disabled={selectedRows.length === 0}>
          {i18n.t('Confirm')}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default SelectionPopup;
