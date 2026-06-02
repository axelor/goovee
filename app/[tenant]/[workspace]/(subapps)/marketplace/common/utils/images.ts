import {SUBAPP_CODES} from '@/constants';

/**
 * URL for a marketplace product screenshot, served by the marketplace image
 * route (`api/products/[product-id]/screenshots/[file-id]`), which access-checks
 * the product per request. Carries productId + fileId so the route can scope the
 * access check to that product.
 */
export function getProductScreenshotURL({
  workspaceURI,
  productId,
  fileId,
}: {
  workspaceURI: string;
  productId: string;
  fileId: string;
}) {
  return `${workspaceURI}/${SUBAPP_CODES.marketplace}/api/products/${productId}/screenshots/${fileId}`;
}
