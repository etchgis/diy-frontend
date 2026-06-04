import { NextResponse } from 'next/server';
import { unzipSync } from 'fflate';

export interface SIRDeparture {
  time: string;
  timestamp: number;
  destination: string;
  isRealTime: boolean;
}

interface TripDeparture {
  tripId: string;
  departureTime: string;
  serviceId: string;
  destination: string;
}

interface GtfsData {
  stGeorgeStopIds: Set<string>;
  departures: TripDeparture[];
  calendar: { serviceId: string; days: boolean[]; startDate: string; endDate: string }[];
  calendarDates: { serviceId: string; date: string; exceptionType: string }[];
}

let gtfsCache: { data: GtfsData; expiresAt: number } | null = null;

function parseCSV(text: string): Record<string, string>[] {
  let cleaned = text.replace(/\r/g, '').trim();
  if (cleaned.charCodeAt(0) === 0xFEFF) cleaned = cleaned.slice(1);
  const lines = cleaned.split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).filter(Boolean).map(line => {
    const values = line.split(',');
    return Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? '').trim()]));
  });
}

function getNYParts(date: Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    weekday: 'short',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  const hour = parseInt(get('hour'));
  const minute = parseInt(get('minute'));
  const dateStr = `${get('year')}${get('month')}${get('day')}`;
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayOfWeek = weekdays.indexOf(get('weekday'));
  return { hour: isNaN(hour) ? 0 : hour, minute: isNaN(minute) ? 0 : minute, dateStr, dayOfWeek };
}

const GTFS_URLS = [
  'https://api.mta.info/GTFS/google_transit.zip',
  'http://web.mta.info/developers/data/nyct/subway/google_transit.zip',
];

async function loadGtfs(): Promise<GtfsData> {
  const now = Date.now();
  if (gtfsCache && now < gtfsCache.expiresAt) return gtfsCache.data;

  let buf: ArrayBuffer | null = null;
  let lastError: unknown;
  for (const url of GTFS_URLS) {
    try {
      const resp = await fetch(url, { next: { revalidate: 86400 } });
      if (resp.ok) {
        buf = await resp.arrayBuffer();
        break;
      }
      lastError = new Error(`HTTP ${resp.status} from ${url}`);
    } catch (err) {
      lastError = err;
    }
  }
  if (!buf) throw new Error(`All GTFS URLs failed. Last error: ${lastError}`);

  const files = unzipSync(new Uint8Array(buf));

  const decode = (name: string): string => {
    const key = Object.keys(files).find(k => k.endsWith('/' + name) || k === name);
    if (!key) throw new Error(`${name} not found in GTFS zip`);
    let text = new TextDecoder().decode(files[key]);
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    return text;
  };

  const trips = parseCSV(decode('trips.txt'));
  const stops = parseCSV(decode('stops.txt'));
  const calendar = parseCSV(decode('calendar.txt'));
  let calendarDates: Record<string, string>[] = [];
  try { calendarDates = parseCSV(decode('calendar_dates.txt')); } catch { /* optional */ }

  const sirTrips = trips.filter(t => t.route_id === 'SI');
  const sirTripIds = new Set(sirTrips.map(t => t.trip_id));
  const tripServiceMap = new Map<string, string>(sirTrips.map(t => [t.trip_id, t.service_id]));

  const stGeorgeStopIds = new Set(
    stops
      .filter(s => s.stop_name?.toLowerCase().replace(/[.\s-]/g, '').includes('stgeorge'))
      .map(s => s.stop_id)
  );

  const stopNames = new Map<string, string>(stops.map(s => [s.stop_id, s.stop_name ?? '']));

  const stopTimesText = decode('stop_times.txt');
  const stLines = stopTimesText.split('\n');
  const stHeaders = stLines[0].replace(/\r/g, '').split(',').map(h => h.trim());
  const col = (name: string) => stHeaders.indexOf(name);
  const tripIdCol = col('trip_id');
  const stopIdCol = col('stop_id');
  const depTimeCol = col('departure_time');
  const seqCol = col('stop_sequence');

  const tripStops = new Map<string, { stopId: string; depTime: string; seq: number }[]>();
  for (let i = 1; i < stLines.length; i++) {
    const line = stLines[i];
    if (!line) continue;
    const vals = line.split(',');
    const tripId = vals[tripIdCol]?.trim();
    if (!tripId || !sirTripIds.has(tripId)) continue;
    if (!tripStops.has(tripId)) tripStops.set(tripId, []);
    tripStops.get(tripId)!.push({
      stopId: vals[stopIdCol]?.trim() ?? '',
      depTime: vals[depTimeCol]?.trim() ?? '',
      seq: parseInt(vals[seqCol]?.trim() ?? '0', 10),
    });
  }

  const departures: TripDeparture[] = [];
  for (const [tripId, stimes] of tripStops) {
    const sorted = stimes.sort((a, b) => a.seq - b.seq);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (!first || !stGeorgeStopIds.has(first.stopId) || !first.depTime) continue;
    departures.push({
      tripId,
      departureTime: first.depTime,
      serviceId: tripServiceMap.get(tripId) ?? '',
      destination: stopNames.get(last?.stopId ?? '') || 'Tottenville',
    });
  }

  const calendarData = calendar.map(c => ({
    serviceId: c.service_id,
    days: [c.monday, c.tuesday, c.wednesday, c.thursday, c.friday, c.saturday, c.sunday].map(d => d === '1'),
    startDate: c.start_date,
    endDate: c.end_date,
  }));

  const calendarDatesData = calendarDates.map(c => ({
    serviceId: c.service_id,
    date: c.date,
    exceptionType: c.exception_type,
  }));

  const data: GtfsData = { stGeorgeStopIds, departures, calendar: calendarData, calendarDates: calendarDatesData };
  gtfsCache = { data, expiresAt: now + 24 * 60 * 60 * 1000 };
  return data;
}

function gtfsTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

function formatTime(hour: number, minute: number): string {
  const h24 = hour % 24;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return `${h12}:${minute.toString().padStart(2, '0')} ${period}`;
}

async function getSIRDepartures(limit = 6): Promise<SIRDeparture[]> {
  const gtfs = await loadGtfs();
  const { hour, minute, dayOfWeek, dateStr } = getNYParts();

  const activeServices = new Set(
    gtfs.calendar
      .filter(c => {
        const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        return c.days[idx] && c.startDate <= dateStr && c.endDate >= dateStr;
      })
      .map(c => c.serviceId)
  );
  for (const ex of gtfs.calendarDates) {
    if (ex.date === dateStr) {
      if (ex.exceptionType === '1') activeServices.add(ex.serviceId);
      else if (ex.exceptionType === '2') activeServices.delete(ex.serviceId);
    }
  }

  const nowMinutes = hour * 60 + minute;
  const nowMs = Date.now();

  const results = gtfs.departures
    .filter(d => activeServices.has(d.serviceId))
    .map(d => ({ d, depMin: gtfsTimeToMinutes(d.departureTime) }))
    .filter(({ depMin }) => depMin > nowMinutes && depMin <= nowMinutes + 300)
    .sort((a, b) => a.depMin - b.depMin)
    .slice(0, limit)
    .map(({ d, depMin }) => {
      const h = Math.floor(depMin / 60);
      const m = depMin % 60;
      return {
        time: formatTime(h, m),
        timestamp: nowMs + (depMin - nowMinutes) * 60000,
        destination: d.destination,
        isRealTime: false,
      };
    });

  return results;
}

export async function GET() {
  try {
    const departures = await getSIRDepartures();
    return NextResponse.json({ departures, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[SIR] Error loading departures:', err);
    return NextResponse.json({ departures: [], fetchedAt: new Date().toISOString(), error: String(err) }, { status: 500 });
  }
}
