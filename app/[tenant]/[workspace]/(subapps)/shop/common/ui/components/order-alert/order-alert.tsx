'use client';

import {i18n} from '@/lib/core/locale';
import {useState, useEffect} from 'react';

import {Dialog, DialogContent, DialogTitle} from '@/ui/components/dialog';
import {ORDER_SUCCESS_PARAM} from '../../../constants';

export function OrderAlert() {
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get(ORDER_SUCCESS_PARAM) === 'true') {
      setShowDialog(true);

      const newParams = new URLSearchParams();

      for (const [key, value] of params.entries()) {
        if (key !== ORDER_SUCCESS_PARAM) {
          newParams.append(key, value);
        }
      }

      const newSearch = newParams.toString() ? `?${newParams.toString()}` : '';
      const newUrl = window.location.pathname + newSearch;

      window.history.replaceState(null, '', newUrl);
    }
  }, []);

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="py-16 px-10">
        <DialogTitle className="text-center">
          {i18n.t('Order completed successfully.')}
        </DialogTitle>
      </DialogContent>
    </Dialog>
  );
}
