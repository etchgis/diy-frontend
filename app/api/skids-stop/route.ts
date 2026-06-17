import { NextRequest, NextResponse } from 'next/server';

const SKIDS_URL = process.env.NEXT_PUBLIC_SKIDS_URL;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get('serviceId');
  const orgId = searchParams.get('orgId');
  const stopId = searchParams.get('stopId');
  const n = searchParams.get('n') || '20';

  if (!serviceId || !orgId || !stopId || !SKIDS_URL) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const url = `${SKIDS_URL}/feed/${encodeURIComponent(serviceId)}/stops/${encodeURIComponent(stopId)}?timestamp=${Date.now()}&n=${n}&nysdot=true`;

  const headers = {
    'Content-Type': 'application/json',
    'X-Organization-Id': orgId,
    'X-Skids-Route-Key': serviceId,
  };

  try {
    let response = await fetch(url, { headers });

    if ((response.status === 503 || response.status === 504) ) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      response = await fetch(url, { headers });
    }

    if (!response.ok) {
      return NextResponse.json({ error: `Upstream error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch stop data' }, { status: 502 });
  }
}
