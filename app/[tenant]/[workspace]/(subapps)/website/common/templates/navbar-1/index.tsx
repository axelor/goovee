// ---- LOCAL IMPORTS ---- //
import {TemplateProps, Menu} from '@/subapps/website/common/types';
import {NavbarContent} from './content';

export default function Navbar1(props: TemplateProps<any, Menu>) {
  const {menu} = props;

  if (!menu) {
    return null;
  }

  const {menuList} = menu;

  return <NavbarContent values={{menuList}} />;
}
