import {permanentRedirect} from 'next/navigation';

export default function ProductsRedirect() {
  // '.' resolves to the parent directory of /marketplace/products → /marketplace.
  permanentRedirect('.');
}
