import {SUBAPP_CODES} from '@/constants';
import {withBasePath} from '@/lib/core/path/base-path';

/**
 * URL for a marketplace product screenshot, served by the marketplace image
 * route (`api/products/[product-id]/screenshots/[file-id]`), which access-checks
 * the product per request. Carries productId + fileId so the route can scope the
 * access check to that product.
 *
 * `workspaceURI` is router-relative, so the deployment base path has to be added
 * here: this value is read as a raw image src, which Next.js does not rewrite.
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
  return withBasePath(
    `${workspaceURI}/${SUBAPP_CODES.marketplace}/api/products/${productId}/screenshots/${fileId}`,
  );
}
