import {SUBAPP_CODES} from '@/constants';
import type {WorkspaceScope} from '@/lib/core/url/workspace-urls';

/**
 * URL for a marketplace product screenshot, served by the marketplace image
 * route (`api/products/[product-id]/screenshots/[file-id]`), which access-checks
 * the product per request. Carries productId + fileId so the route can scope the
 * access check to that product.
 *
 * The browser form of the address, because this value is read as a raw image
 * src, which Next.js does not rewrite.
 */
export function getProductScreenshotURL({
  scope,
  productId,
  fileId,
}: {
  scope: WorkspaceScope;
  productId: string;
  fileId: string;
}) {
  return scope.forBrowser(
    `/${SUBAPP_CODES.marketplace}/api/products/${productId}/screenshots/${fileId}`,
  );
}
