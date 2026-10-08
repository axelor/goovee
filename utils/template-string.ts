const template = (strings: TemplateStringsArray, ...values: any[]) =>
  String.raw({raw: strings}, ...values);

export const sql = template;
export const html = template;
export const xml = template;

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** A value safe to place in HTML text or a quoted attribute; `html` itself escapes nothing. */
export function escapeHtml(value: string | null | undefined): string {
  return (value ?? '').replace(
    /[&<>"']/g,
    character => HTML_ESCAPES[character],
  );
}
