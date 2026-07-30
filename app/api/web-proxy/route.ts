import { NextRequest, NextResponse } from 'next/server';

// Block requests to private/loopback ranges to prevent SSRF
const BLOCKED_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|0\.0\.0\.0)/;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return NextResponse.json({ error: 'Only HTTP/HTTPS URLs allowed' }, { status: 400 });
  }

  if (BLOCKED_HOST.test(parsed.hostname)) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
    });
  } catch {
    return NextResponse.json({ error: 'Failed to reach URL' }, { status: 502 });
  }

  const contentType = upstream.headers.get('content-type') ?? 'text/html; charset=utf-8';
  let body = await upstream.text();

  // For HTML responses, inject a <base> tag so relative URLs in the page resolve
  // correctly against the original origin (CSS, JS, images, etc. still load
  // directly from the source domain — only the initial HTML comes through us).
  if (contentType.includes('text/html')) {
    const baseTag = `<base href="${parsed.origin}/">`;
    if (/<head[^>]*>/i.test(body)) {
      body = body.replace(/<head[^>]*>/i, (m) => `${m}\n  ${baseTag}`);
    } else {
      body = baseTag + body;
    }
  }

  const headers = new Headers({
    'Content-Type': contentType,
    // Do NOT forward X-Frame-Options or Content-Security-Policy — those are
    // what blocks the iframe. By omitting them the browser allows framing.
    'Cache-Control': 'no-store',
  });

  return new NextResponse(body, { status: upstream.status, headers });
}
