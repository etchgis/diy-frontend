// Rail lines are numbered ("1", "2"), so the badge shows the branch name too:
// "2 - Hempstead". Bus names like "Q2" already read fine and are left alone.

// GTFS route_type for rail.
const RAIL_ROUTE_TYPE = 2;

type RouteLike = {
  id?: string;
  route_id?: string;
  longName?: string;
  route_long_name?: string;
};

// Builds a "serviceId:routeId" -> line name lookup. Earlier sources win, so pass the
// most reliable list first. The serviceId keeps LIRR and Metro-North apart, since their
// route ids can be the same number.
export function buildRouteLineNameMap(
  sources: Array<{ serviceId: string; routes: RouteLike[] }>
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const { serviceId, routes } of sources) {
    if (!serviceId) continue;
    for (const route of routes || []) {
      const routeId = route.id ?? route.route_id;
      const longName = route.longName ?? route.route_long_name ?? '';
      if (!routeId || !longName) continue;
      const key = `${serviceId}:${routeId}`;
      if (map[key]) continue;
      map[key] = longName
        .replace(/\s+Branch$/i, '')
        .replace(/\s+Line$/i, '')
        .replace(/\s+Railroad$/i, '')
        .trim();
    }
  }
  return map;
}

// The text for one arrival's route badge. Rail gets the branch name; everything else
// keeps its short name. The agency suffix still applies when there is no branch name.
export function arrivalRouteLabel(
  arrival: { routeShortName?: string; routeId?: string; routeType?: number; _sourceService?: string },
  lineNames: Record<string, string>,
  agencyAbbreviations: Record<string, string>
): string {
  const shortName = arrival.routeShortName || '';
  const serviceId = arrival._sourceService || '';

  if (arrival.routeType === RAIL_ROUTE_TYPE) {
    const lineName = lineNames[`${serviceId}:${arrival.routeId}`]
      || lineNames[`${serviceId}:${shortName}`];
    if (lineName) return `${shortName} - ${lineName}`;
  }

  const abbreviation = agencyAbbreviations[serviceId];
  return abbreviation ? `${shortName} ${abbreviation}` : shortName;
}
