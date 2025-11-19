'use client';

import {i18n} from '@/lib/core/locale';
import {useState, useEffect} from 'react';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/ui/components/alert-dialog';
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

  const handleClose = () => {
    setShowDialog(false);
  };

  return (
    <AlertDialog open={showDialog}>
      <AlertDialogContent className="bg-success-dark border-success-dark">
        <AlertDialogTitle className="text-success-light">
          {i18n.t('Order completed successfully.')}
        </AlertDialogTitle>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="border-success-dark"
            onClick={handleClose}>
            {i18n.t('OK')}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
