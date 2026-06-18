import { NextRequest, NextResponse } from 'next/server';

const SKIDS_URL = process.env.NEXT_PUBLIC_SKIDS_URL;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const radius = searchParams.get('radius');
  const system = searchParams.get('system');

  if (!lat || !lon || !radius || !system || !SKIDS_URL) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const url = `${SKIDS_URL}/api/gbfs/stations/nearby?lat=${lat}&lon=${lon}&radius=${radius}&system=${encodeURIComponent(system)}`;

  try {
    const response = await fetch(url, { headers: { 'Content-Type': 'application/json' } });

    if (!response.ok) {
      return NextResponse.json({ error: `Upstream error: ${response.status}` }, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ error: 'Failed to fetch GBFS data' }, { status: 502 });
  }
}
