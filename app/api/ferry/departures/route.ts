import { NextResponse } from 'next/server';
import { unzipSync } from 'fflate';

export interface FerryDeparture {
  time: string;
  timestamp: number;
  destination: string;
  isRealTime: boolean;
}

interface GtfsData {
  stGeorgeStopId: string;
  departures: { tripId: string; departureTime: string; serviceId: string }[];
  calendar: { serviceId: string; days: boolean[]; startDate: string; endDate: string }[];
  calendarDates: { serviceId: string; date: string; exceptionType: string }[];
}

let gtfsCache: { data: GtfsData; expiresAt: number } | null = null;

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r/g, '').trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
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

async function loadGtfs(): Promise<GtfsData> {
  const now = Date.now();
  if (gtfsCache && now < gtfsCache.expiresAt) return gtfsCache.data;

  const resp = await fetch(
    'https://www.nyc.gov/html/dot/downloads/misc/siferry-gtfs.zip',
    { next: { revalidate: 86400 } }
  );
  if (!resp.ok) throw new Error(`SI Ferry GTFS fetch failed: ${resp.status}`);

  const buf = await resp.arrayBuffer();
  const files = unzipSync(new Uint8Array(buf));
  const findFile = (name: string): Uint8Array => {
    const key = Object.keys(files).find(k => k.endsWith('/' + name) || k === name);
    if (!key) throw new Error(`${name} not found in GTFS zip`);
    return files[key];
  };
  const decode = (name: string) => {
    let text = new TextDecoder().decode(findFile(name));
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    return text;
  };

  const stops = parseCSV(decode('stops.txt'));
  const stopTimes = parseCSV(decode('stop_times.txt'));
  const trips = parseCSV(decode('trips.txt'));
  const calendar = parseCSV(decode('calendar.txt'));
  let calendarDates: Record<string, string>[] = [];
  try { calendarDates = parseCSV(decode('calendar_dates.txt')); } catch { /* optional */ }

  const stGStop = stops.find(s =>
    s.stop_name?.toLowerCase().includes('st. george') ||
    s.stop_name?.toLowerCase().includes('saint george')
  );
  const stGeorgeStopId = stGStop?.stop_id ?? stops[0]?.stop_id ?? '';

  const tripServiceMap = new Map<string, string>(trips.map(t => [t.trip_id, t.service_id]));

  // Only outbound departures (stop_sequence=1 means the ferry starts here)
  const departures = stopTimes
    .filter(st => st.stop_id === stGeorgeStopId && parseInt(st.stop_sequence) === 1 && st.departure_time)
    .map(st => ({
      tripId: st.trip_id,
      departureTime: st.departure_time,
      serviceId: tripServiceMap.get(st.trip_id) ?? '',
    }));

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

  const data: GtfsData = { stGeorgeStopId, departures, calendar: calendarData, calendarDates: calendarDatesData };
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

async function getSIFerryDepartures(limit = 5): Promise<FerryDeparture[]> {
  try {
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
    // Apply calendar_dates.txt exceptions
    for (const ex of gtfs.calendarDates) {
      if (ex.date === dateStr) {
        if (ex.exceptionType === '1') activeServices.add(ex.serviceId);
        else if (ex.exceptionType === '2') activeServices.delete(ex.serviceId);
      }
    }

    const nowMinutes = hour * 60 + minute;
    const nowMs = Date.now();

    return gtfs.departures
      .filter(d => activeServices.has(d.serviceId))
      .map(d => ({ d, depMin: gtfsTimeToMinutes(d.departureTime) }))
      .filter(({ depMin }) => depMin > nowMinutes && depMin <= nowMinutes + 300) // next 5 hours
      .sort((a, b) => a.depMin - b.depMin)
      .slice(0, limit)
      .map(({ depMin }) => {
        const h = Math.floor(depMin / 60);
        const m = depMin % 60;
        const minFromNow = depMin - nowMinutes;
        return {
          time: formatTime(h, m),
          timestamp: nowMs + minFromNow * 60000,
          destination: 'Whitehall Terminal, Manhattan',
          isRealTime: false,
        };
      });
  } catch (err) {
    console.error('[FERRY] SI Ferry error:', err);
    return [];
  }
}

async function getNYCFerryDepartures(): Promise<FerryDeparture[]> {
  try {
    const resp = await fetch(
      'https://nycferry.connexionz.net/rtt/Public/Utility/File.aspx?ContentType=SQLXML&Name=RoutePositionET.xml&PlatformTag=137',
      { cache: 'no-store' }
    );
    if (!resp.ok) throw new Error(`NYC Ferry API ${resp.status}`);

    const xml = await resp.text();
    const nowMs = Date.now();
    const results: FerryDeparture[] = [];

    const destRx = /<Destination\s+Name="([^"]+)"[^>]*>([\s\S]*?)<\/Destination>/g;
    const tripRx = /<Trip\s+ETA="(\d+)"/g;

    let dm: RegExpExecArray | null;
    while ((dm = destRx.exec(xml)) !== null) {
      const destination = dm[1];
      const block = dm[2];
      tripRx.lastIndex = 0;
      let tm: RegExpExecArray | null;
      while ((tm = tripRx.exec(block)) !== null) {
        const eta = parseInt(tm[1], 10);
        const ts = nowMs + eta * 60000;
        const dep = new Date(ts);
        const { hour, minute } = getNYParts(dep);
        results.push({
          time: formatTime(hour, minute),
          timestamp: ts,
          destination,
          isRealTime: true,
        });
      }
    }

    return results.sort((a, b) => a.timestamp - b.timestamp);
  } catch (err) {
    console.error('[FERRY] NYC Ferry error:', err);
    return [];
  }
}

export async function GET() {
  const [si, nyc] = await Promise.allSettled([
    getSIFerryDepartures(),
    getNYCFerryDepartures(),
  ]);

  return NextResponse.json({
    siFerry: si.status === 'fulfilled' ? si.value : [],
    nycFerry: nyc.status === 'fulfilled' ? nyc.value : [],
    fetchedAt: new Date().toISOString(),
  });
}
