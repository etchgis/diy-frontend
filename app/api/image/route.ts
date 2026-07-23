import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTNAME = 'diy-public-transit-screens.s3.amazonaws.com';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  if (parsed.hostname !== ALLOWED_HOSTNAME) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
  }

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 });
  }
}
