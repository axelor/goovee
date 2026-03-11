import {t} from '@/locale/server';
import {Alert, AlertDescription} from '@/ui/components';

export async function TokenInvalid() {
  const label = await t('Token is either invalid or expired.');
  return (
    <div className="flex justify-center items-center min-h-[40vh]">
      <Alert variant="destructive" className="max-w-sm">
        <AlertDescription>{label}</AlertDescription>
      </Alert>
    </div>
  );
}
