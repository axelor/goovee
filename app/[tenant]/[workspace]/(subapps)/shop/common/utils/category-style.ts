// Deterministic visual style for product categories — derives a hue (0-359)
// from the category name. Categories have no visual metadata in Axelor, so we
// hash the name to get a stable colour per category (placeholder gradient for
// products that have no image).

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

export function getCategoryHue(name: string | null | undefined): number {
  if (!name) return 215; // royal blue fallback
  return djb2(name) % 360;
}

export function getCategoryGradient(hue: number): string {
  return `
    radial-gradient(circle at 30% 30%, hsla(${hue}, 55%, 75%, 0.5), transparent 60%),
    linear-gradient(135deg, hsl(${hue}, 30%, 88%) 0%, hsl(${(hue + 20) % 360}, 30%, 72%) 100%)
  `;
}
