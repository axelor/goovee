import DOMPurify from 'dompurify';

/* The tags the back-office drops from a value before putting it on the page. */
export const FORBIDDEN_TAGS = ['style', 'form'];

export function sanitizeHtml(html: string) {
  return DOMPurify.sanitize(html, {FORBID_TAGS: FORBIDDEN_TAGS});
}
