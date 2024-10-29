import {i18n} from '@/i18n';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/components';
import {X} from 'lucide-react';
import {ReactNode, useCallback, useState} from 'react';
import {MdAdd, MdLink} from 'react-icons/md';

export function TicketLinkHeader({
  title,
  alertTitle,
  dialogTitle,
  alertContentRenderer,
  dialogContentRenderer,
}: {
  title: ReactNode;
  alertTitle?: ReactNode;
  dialogTitle?: ReactNode;
  dialogContentRenderer?: ({
    closeDialog,
  }: {
    closeDialog: () => void;
  }) => ReactNode;
  alertContentRenderer?: ({closeAlert}: {closeAlert: () => void}) => ReactNode;
}) {
  const [showAlert, setShowAlert] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const closeDialog = useCallback(() => {
    setShowDialog(false);
  }, []);

  const closeAlert = useCallback(() => {
    setShowAlert(false);
  }, []);

  const openAlert = useCallback(() => {
    setShowAlert(true);
  }, []);

  return (
    <>
      <div className="flex">
        <h4 className="text-xl font-semibold">{title}</h4>
        <div className="flex gap-2 ms-auto">
          {!showAlert && alertContentRenderer && (
            <Button
              size="sm"
              type="button"
              variant="success"
              onClick={openAlert}>
              <MdLink className="size-6 lg:me-1" />
              <span className="hidden lg:inline">{i18n.get('Link')}</span>
            </Button>
          )}
          {dialogContentRenderer && (
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button size="sm" type="button" variant="success">
                  <MdAdd className="size-6 lg:me-1" />
                  <span className="hidden lg:inline">{i18n.get('New')}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-full container overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{dialogTitle}</DialogTitle>
                  {dialogContentRenderer({closeDialog})}
                </DialogHeader>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      {showAlert && alertContentRenderer && (
        <Alert variant="warning" className="group mt-2">
          <button
            className="ring-0 absolute right-2 top-2 rounded-md cursor-pointer p-1 text-foreground/50 lg:opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none group-hover:opacity-100"
            onClick={() => setShowAlert(false)}>
            <X className="h-4 w-4" />
          </button>
          <AlertTitle>{alertTitle}</AlertTitle>
          <AlertDescription>
            {alertContentRenderer({closeAlert})}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
