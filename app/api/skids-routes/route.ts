import { NextRequest, NextResponse } from 'next/server';

const SKIDS_URL = process.env.NEXT_PUBLIC_SKIDS_URL;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  // serviceId (single) used by route-restore; serviceIds (comma-separated) used by fetchRouteData
  const serviceId = searchParams.get('serviceId');
  const serviceIds = searchParams.get('serviceIds') ?? serviceId;
  const orgId = searchParams.get('orgId');
  const geometry = searchParams.get('geometry') ?? 'false';
  const stops = searchParams.get('stops') ?? 'false';

  if (!serviceIds || !orgId || !SKIDS_URL) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  // Use the first serviceId as the route key
  const routeKey = serviceId ?? serviceIds.split(',')[0];
  const url = `${SKIDS_URL}/feed/routes?geometry=${geometry}&stops=${stops}&nysdot=true&serviceIds=${encodeURIComponent(serviceIds)}`;

  const headers = {
    'Content-Type': 'application/json',
    'X-Organization-Id': orgId,
    'X-Skids-Route-Key': routeKey,
  };

  try {
    const response = await fetch(url, { headers, next: { revalidate: 3600 } });

    if (!response.ok) {
      return NextResponse.json({ error: `Upstream error: ${response.status}` }, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 502 });
  }
}
