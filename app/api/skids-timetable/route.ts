import { NextRequest, NextResponse } from 'next/server';

const SKIDS_URL = process.env.NEXT_PUBLIC_SKIDS_URL;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get('serviceId');
  const orgId = searchParams.get('orgId');
  const routeId = searchParams.get('routeId');
  const startTime = searchParams.get('startTime');
  const endTime = searchParams.get('endTime');
  const direction = searchParams.get('direction');

  if (!serviceId || !orgId || !routeId || !startTime || !endTime || !SKIDS_URL) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  let url = `${SKIDS_URL}/feed/${encodeURIComponent(serviceId)}/routes/${encodeURIComponent(routeId)}/timetable?startTime=${startTime}&endTime=${endTime}&nysdot=true`;
  if (direction !== null) {
    url += `&direction=${direction}`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': orgId,
        'X-Skids-Route-Key': serviceId,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      return NextResponse.json(
        { error: `Upstream error: ${response.status}`, body: errorBody },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch timetable' }, { status: 502 });
  }
}
