const TRAFFIC_URL = 'https://511ny.etch.app/traffic/api/navigate';

export interface TrafficAlternative {
  label: string;
  seconds: number;
  minutes: number;
}

export interface TrafficResult {
  coordinates: [number, number];
  alternatives: TrafficAlternative[];
}

export async function fetchTrafficData(
  origin: [number, number],
  destinations: [number, number][]
): Promise<TrafficResult[]> {
  const response = await fetch(TRAFFIC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin,
      destinations: destinations.map((coords) => ({ coordinates: coords })),
    }),
  });

  if (!response.ok) {
    throw new Error(`Traffic API error: ${response.statusText}`);
  }

  return response.json();
}
