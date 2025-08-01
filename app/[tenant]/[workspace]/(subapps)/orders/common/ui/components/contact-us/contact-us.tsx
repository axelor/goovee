'use client';

import React from 'react';
import {MdKeyboardReturn, MdHelpOutline} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {Separator, Button} from '@/ui/components';
import {i18n} from '@/locale';

export const ContactUs = () => {
  return (
    <>
      <div className="flex flex-col gap-4 bg-card text-card-foreground p-6 rounded-lg">
        <h4 className="text-xl font-medium mb-0">{i18n.t('Contact us')}</h4>
        <Separator />
        <Button
          variant="outline"
          className="flex items-center justify-center gap-3 rounded-full w-full !font-medium">
          <MdKeyboardReturn className="text-2xl" /> {i18n.t('Return product')}
        </Button>
        <Button
          variant="outline"
          className="flex items-center justify-center gap-3 rounded-full w-full !font-medium">
          <MdHelpOutline className="text-2xl" /> {i18n.t('Need help')}
        </Button>
      </div>
    </>
  );
};
export default ContactUs;
