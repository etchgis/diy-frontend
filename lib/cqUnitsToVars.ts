// Saved rich text can contain container query units (e.g. "height: 9.5cqh"), which Chrome 63-104
// ignore. Rewrite them to the --cq* variables that ResolutionFrame sets, which size the same way.
const CQ_UNIT = /(-?(?:\d+\.?\d*|\.\d+))(cqw|cqh|cqmin|cqmax)\b/gi;

export function cqUnitsToVars(html: string): string {
  if (!html || !/cq/i.test(html)) return html;
  return html.replace(CQ_UNIT, (_, n, unit) => `calc(${n}*var(--${unit.toLowerCase()}))`);
}
