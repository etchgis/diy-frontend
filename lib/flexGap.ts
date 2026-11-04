import type { CSSProperties } from 'react';

// Space between flex children, applied as margins by the hgap (row) or vgap (column) class in
// globals.css. Use instead of gap where slides must look right on Chrome 63-83, which ignore gap
// on flex containers. The size needs a unit, e.g. '8px'.
export const flexGap = (size: string) => ({ '--gap': size }) as CSSProperties;
