import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get('date');
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  if (date) {
    const d = await prisma.day.findUnique({ where: { dateStr: date } });
    return NextResponse.json(d ?? null);
  }

  if (start && end) {
    const rows = await prisma.day.findMany({
      where: { dateStr: { gte: start, lte: end } },
      orderBy: { dateStr: 'asc' },
    });
    return NextResponse.json(rows);
  }

  return NextResponse.json(
    { error: 'Provide ?date=YYYY-MM-DD or ?start=YYYY-MM-DD&end=YYYY-MM-DD' },
    { status: 400 }
  );
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null as any);
  if (!body?.date) return NextResponse.json({ error: 'date is required' }, { status: 400 });

  const dateStr = String(body.date);
  const who = typeof body.who === 'string' ? body.who : null;
  const lesson = typeof body.lesson === 'string' ? body.lesson : null;

  const row = await prisma.day.upsert({
    where: { dateStr },
    create: { dateStr, who, lesson },
    update: { who, lesson },
  });

  return NextResponse.json(row);
}
