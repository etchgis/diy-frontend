const STORAGE_KEY = 'last-published-screens';
const FOOTER_STORAGE_KEY = 'last-published-footer';

export interface PublishDiff {
  added: Array<{ type: string }>;
  removed: Array<{ type: string }>;
  modified: Array<{ type: string }>;
  reordered: boolean;
  footerChanged: boolean;
}

export function computePublishDiff(newScreens: any[], newFooter?: any): PublishDiff | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  let prev: any[];
  try {
    prev = JSON.parse(raw);
  } catch {
    return null;
  }

  const prevById = new Map(prev.map((s: any) => [s.id, s]));
  const newById = new Map(newScreens.map((s: any) => [s.id, s]));

  const added = newScreens.filter((s) => !prevById.has(s.id));
  const removed = prev.filter((s: any) => !newById.has(s.id));
  const modified = newScreens.filter((s) => {
    if (!prevById.has(s.id)) return false;
    return JSON.stringify(s) !== JSON.stringify(prevById.get(s.id));
  });

  const sharedPrev = prev.map((s: any) => s.id).filter((id: string) => newById.has(id));
  const sharedNew = newScreens.map((s) => s.id).filter((id) => prevById.has(id));
  const reordered = JSON.stringify(sharedPrev) !== JSON.stringify(sharedNew);

  const prevFooterRaw = localStorage.getItem(FOOTER_STORAGE_KEY);
  const prevFooter = prevFooterRaw ? JSON.parse(prevFooterRaw) : null;
  const footerChanged = newFooter != null && JSON.stringify(newFooter) !== JSON.stringify(prevFooter);

  return { added, removed, modified, reordered, footerChanged };
}

export function hasAnyChanges(diff: PublishDiff): boolean {
  return diff.added.length > 0 || diff.removed.length > 0 || diff.modified.length > 0 || diff.reordered || diff.footerChanged;
}

export function savePublishedScreens(screens: any[], footer?: any): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(screens));
  if (footer != null) {
    localStorage.setItem(FOOTER_STORAGE_KEY, JSON.stringify(footer));
  }
}

export function formatScreenType(type: string): string {
  return type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
