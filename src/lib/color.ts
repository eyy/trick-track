// Deterministic, stable color per category name — no picker UI needed.
// A curated, muted palette that sits well on the dark ink and doesn't
// fight the amber accent (vs. a raw full-spectrum rainbow).
const PALETTE = [
  '#c97f6a', // terracotta
  '#6fa897', // teal
  '#b277a0', // mauve
  '#7a93c7', // slate blue
  '#93a86a', // olive
  '#a98cc9', // muted violet
  '#c98aa0', // dusty rose
  '#7fb0b6', // aqua
];

export function categoryColor(name: string): string {
  const hash = name.split('').reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 0);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
