import { NextRequest, NextResponse } from 'next/server';

const SKIDS_URL = process.env.NEXT_PUBLIC_SKIDS_URL;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get('serviceId');
  const orgId = searchParams.get('orgId');

  if (!serviceId || !orgId || !SKIDS_URL) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const url = `${SKIDS_URL}/feed/routes?geometry=false&stops=false&nysdot=true&serviceIds=${encodeURIComponent(serviceId)}`;

  const headers = {
    'Content-Type': 'application/json',
    'X-Organization-Id': orgId,
    'X-Skids-Route-Key': serviceId,
  };

  try {
    let response = await fetch(url, { headers, next: { revalidate: 3600 } });

    if (response.status === 503 || response.status === 504) {
      await new Promise(r => setTimeout(r, 2000));
      response = await fetch(url, { headers, next: { revalidate: 3600 } });
    }

    if (!response.ok) {
      return NextResponse.json({ error: `Upstream error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 502 });
  }
}
