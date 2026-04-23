import type { HeadsignFilter, RouteInfo, ServiceSelection } from '@/stores/fixedRoute';

interface ArrivalLike {
  routeId?: string;
  destination?: string;
  _sourceService?: string;
}

const normalize = (s: string) => s.toLowerCase().trim();

export function matchesRoute(arrival: ArrivalLike, selection: ServiceSelection | undefined): boolean {
  if (!selection || !selection.enabledRouteIds || selection.enabledRouteIds.length === 0) return true;
  if (!arrival.routeId) return true;
  return selection.enabledRouteIds.includes(arrival.routeId);
}

export function matchesHeadsign(arrival: ArrivalLike, selection: ServiceSelection | undefined): boolean {
  const filters = selection?.selectedHeadsignFilters;
  if (!filters || filters.length === 0) return true;
  const destination = normalize(arrival.destination || '');
  return filters.some((filter) => {
    if (typeof filter === 'string') {
      return destination === normalize(filter);
    }
    if (!arrival.routeId || arrival.routeId !== filter.routeId) return false;
    return destination === normalize(filter.headsign);
  });
}

export function applyArrivalFilters<T extends ArrivalLike>(
  arrivals: T[],
  serviceSelections: ServiceSelection[] | undefined
): T[] {
  if (!serviceSelections || serviceSelections.length === 0) return arrivals;
  return arrivals.filter((arr) => {
    const selection = serviceSelections.find((s) => s.serviceId === arr._sourceService);
    if (selection && selection.enabled === false) return false;
    return matchesRoute(arr, selection) && matchesHeadsign(arr, selection);
  });
}

// Rewrite legacy string filters to route-scoped objects by attributing each to every
// enabled route that carries the headsign. Unattributable strings pass through.
export function migrateHeadsignFilters(
  filters: HeadsignFilter[] | undefined,
  routes: RouteInfo[] | undefined,
  enabledRouteIds: string[] | undefined
): HeadsignFilter[] | undefined {
  if (!filters || filters.length === 0) return filters;
  if (!routes || routes.length === 0) return filters;

  const enabledIds = enabledRouteIds && enabledRouteIds.length > 0
    ? new Set(enabledRouteIds)
    : new Set(routes.map((r) => r.id));

  const enabledRoutes = routes.filter((r) => enabledIds.has(r.id));

  const migrated: HeadsignFilter[] = [];
  let changed = false;

  for (const filter of filters) {
    if (typeof filter !== 'string') {
      migrated.push(filter);
      continue;
    }
    const target = normalize(filter);
    const matchingRoutes = enabledRoutes.filter((r) =>
      (r.headsigns || []).some((h) => normalize(h) === target)
    );
    if (matchingRoutes.length === 0) {
      // Can't attribute — leave as string; the matcher's string branch still applies it.
      migrated.push(filter);
      continue;
    }
    changed = true;
    for (const r of matchingRoutes) {
      migrated.push({ routeId: r.id, headsign: filter });
    }
  }

  return changed ? dedupeFilters(migrated) : filters;
}

function dedupeFilters(filters: HeadsignFilter[]): HeadsignFilter[] {
  const seen = new Set<string>();
  const out: HeadsignFilter[] = [];
  for (const f of filters) {
    const key = typeof f === 'string' ? `s:${normalize(f)}` : `o:${f.routeId}|${normalize(f.headsign)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
}

// Drop filters whose target headsign no longer exists on any enabled route.
export function validateHeadsignFilters(
  filters: HeadsignFilter[] | undefined,
  routes: RouteInfo[] | undefined,
  enabledRouteIds: string[] | undefined
): HeadsignFilter[] | undefined {
  if (!filters || filters.length === 0) return undefined;
  if (!routes || routes.length === 0) return undefined;

  const enabledIds = enabledRouteIds && enabledRouteIds.length > 0
    ? new Set(enabledRouteIds)
    : new Set(routes.map((r) => r.id));

  const enabledRoutes = routes.filter((r) => enabledIds.has(r.id));
  const headsignsByRoute = new Map<string, Set<string>>();
  const allEnabledHeadsigns = new Set<string>();
  for (const r of enabledRoutes) {
    const set = new Set((r.headsigns || []).map(normalize));
    headsignsByRoute.set(r.id, set);
    set.forEach((h) => allEnabledHeadsigns.add(h));
  }

  const kept = filters.filter((f) => {
    if (typeof f === 'string') {
      return allEnabledHeadsigns.has(normalize(f));
    }
    const routeHeadsigns = headsignsByRoute.get(f.routeId);
    return !!routeHeadsigns && routeHeadsigns.has(normalize(f.headsign));
  });

  return kept.length > 0 ? kept : undefined;
}

export function isHeadsignSelected(
  filters: HeadsignFilter[] | undefined,
  routeId: string,
  headsign: string
): boolean {
  if (!filters || filters.length === 0) return false;
  const target = normalize(headsign);
  return filters.some((f) => {
    if (typeof f === 'string') return normalize(f) === target;
    return f.routeId === routeId && normalize(f.headsign) === target;
  });
}
