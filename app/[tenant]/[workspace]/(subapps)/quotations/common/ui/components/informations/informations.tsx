'use client';
import React from 'react';
import {MdOutlineFileDownload} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {Separator, Button, Chip} from '@/ui/components';
import {i18n} from '@/locale';
import {formatDate} from '@/lib/core/locale/formatters';

// ---- LOCAL IMPORTS ---- //
import {getStatus} from '@/subapps/quotations/common/utils/quotations';
import type {InfoProps} from '@/subapps/quotations/common/types/quotations';

export const Informations = ({statusSelect, endOfValidityDate}: InfoProps) => {
  const {variant, status} = getStatus(statusSelect);

  const DateInfoRow = (label: string, date: any) => (
    <div className="flex items-center gap-2">
      <h5 className="text-sm font-medium mb-0">{i18n.t(label)}:</h5>
      <p className="text-sm">{formatDate(date) || '--/--/----'}</p>
    </div>
  );

  const renderDateInfo = () => {
    return DateInfoRow('End of validity', endOfValidityDate);
  };

  return (
    <div className="bg-card text-card-foreground flex md:block flex-col rounded-lg px-6 py-4">
      <h4 className="text-xl font-medium mb-0">{i18n.t('Informations')}</h4>
      <Separator className="my-2" />
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h5 className="text-sm font-medium mb-0">{i18n.t('Status')}:</h5>
          <Chip
            value={i18n.t(status)}
            className="font-normal text-[0.625rem] px-2 py-1"
            variant={variant}
          />
        </div>
        {renderDateInfo()}
        {false && (
          <div className="flex md:flex-row gap-4">
            <Button className="bg-white border border-success text-success hover:bg-success hover:text-white flex items-center justify-center gap-3 rounded-md font-normal">
              <MdOutlineFileDownload className="text-2xl" />{' '}
              {i18n.t('Download invoice')}
            </Button>
            <Button className="bg-white border border-success text-success hover:bg-success hover:text-white flex items-center justify-center gap-3 rounded-md font-normal">
              <MdOutlineFileDownload className="text-2xl" />
              {i18n.t('Download order signed confirmation')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Informations;
