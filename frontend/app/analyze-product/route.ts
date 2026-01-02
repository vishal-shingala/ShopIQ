import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const target = `${backendBase.replace(/\/$/, '')}/analyze-product`;
    // quick health check to provide clearer error messages
    const healthUrl = `${backendBase.replace(/\/$/, '')}/health`;
    try {
      const health = await fetch(healthUrl, { method: 'GET' });
      if (!health.ok) {
        console.error('Backend health check failed', await health.text());
        return NextResponse.json({ error: 'Backend unhealthy' }, { status: 502 });
      }
    } catch (hErr: any) {
      console.error('Backend health check error', hErr);
      return NextResponse.json({ error: `Backend unreachable at ${backendBase}` }, { status: 502 });
    }

    const resp = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await resp.text();
    try {
      const json = JSON.parse(data);
      return NextResponse.json(json, { status: resp.status });
    } catch (e) {
      return new NextResponse(data, { status: resp.status });
    }
  } catch (err: any) {
    console.error('Proxy error to backend analyze-product:', err);
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 502 });
  }
}
