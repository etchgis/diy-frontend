// Rewrites two CSS forms that Chrome 63 signage players do not understand into older equivalents:
// space-separated rgb() colors, as Tailwind writes them (Chrome 65+), and the inset shorthand (Chrome 87+).

const SPACE_RGB = /rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*(?:\/\s*([^)]+?(?:\([^)]*\))?)\s*)?\)/g;

function toCommaRgb(value) {
  return value.replace(SPACE_RGB, (_, r, g, b, alpha) =>
    alpha ? `rgba(${r}, ${g}, ${b}, ${alpha.trim()})` : `rgb(${r}, ${g}, ${b})`,
  );
}

// inset: a [b [c [d]]] follows the same 1-4 value pattern as margin.
function expandInset(decl) {
  const parts = decl.value.trim().split(/\s+/);
  const [top, right = top, bottom = top, left = right] = parts;
  const sides = { top, right, bottom, left };
  for (const side of ['top', 'right', 'bottom', 'left']) {
    decl.cloneBefore({ prop: side, value: sides[side] });
  }
  decl.remove();
}

const legacyCss = () => ({
  postcssPlugin: 'legacy-css',
  Declaration(decl) {
    if (decl.prop === 'inset' && !decl.value.includes('(')) {
      expandInset(decl);
      return;
    }
    if (decl.value.includes('rgb(')) {
      const next = toCommaRgb(decl.value);
      if (next !== decl.value) decl.value = next;
    }
  },
});
legacyCss.postcss = true;

module.exports = legacyCss;
