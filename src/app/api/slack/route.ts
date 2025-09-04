import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { postDayToSlack } from '@/lib/slack';

function todayChicago(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get('date') || todayChicago();
  const day = await prisma.day.findUnique({ where: { dateStr: date } });
  if (!day) return NextResponse.json({ error: `No record for ${date}` }, { status: 404 });

  try {
    const res = await postDayToSlack(day);
    return NextResponse.json({ ok: true, ts: (res as any).ts, date });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Slack error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const date: string | null = typeof body.date === 'string' ? body.date : null;
  if (!date) return NextResponse.json({ error: 'date is required' }, { status: 400 });

  const day = await prisma.day.findUnique({ where: { dateStr: date } });
  if (!day) return NextResponse.json({ error: `No record for ${date}` }, { status: 404 });

  try {
    const res = await postDayToSlack(day);
    return NextResponse.json({ ok: true, ts: (res as any).ts, date });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Slack error' }, { status: 500 });
  }
}
