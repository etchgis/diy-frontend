const STORAGE_KEY = 'last-published-screens';

export interface PublishDiff {
  added: Array<{ type: string }>;
  removed: Array<{ type: string }>;
  modified: Array<{ type: string }>;
  reordered: boolean;
}

export function computePublishDiff(newScreens: any[]): PublishDiff | null {
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

  return { added, removed, modified, reordered };
}

export function hasAnyChanges(diff: PublishDiff): boolean {
  return diff.added.length > 0 || diff.removed.length > 0 || diff.modified.length > 0 || diff.reordered;
}

export function savePublishedScreens(screens: any[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(screens));
}

export function formatScreenType(type: string): string {
  return type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
