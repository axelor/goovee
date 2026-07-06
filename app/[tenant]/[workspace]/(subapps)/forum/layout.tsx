// ---- LOCAL IMPORTS ---- //
import {MENU} from '@/app/[tenant]/[workspace]/(subapps)/forum/common/constants';
import MobileMenu from '@/subapps/forum/mobile-menu';

export default function Layout({children}: {children: React.ReactNode}) {
  return (
    <>
      {children}
      <MobileMenu items={MENU} />
    </>
  );
}
