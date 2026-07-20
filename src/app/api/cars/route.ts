import { NextRequest, NextResponse } from 'next/server';
import { listCars, createCar, getDb, getStats } from '@/lib/db';

export async function GET() {
  const cars = listCars();
  const stats = getStats();
  return NextResponse.json({ cars, stats });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { brand, model, year_from, year_to, max_price, max_km, fuel } = body;

  if (!brand || !model || !max_price) {
    return NextResponse.json({ error: 'Brand, model, and max_price are required' }, { status: 400 });
  }

  const count = (getDb().prepare('SELECT COUNT(*) as c FROM cars WHERE enabled = 1').get() as any).c;
  if (count >= 3) {
    return NextResponse.json({ error: 'Maximum 3 active cars allowed. Disable one first.' }, { status: 400 });
  }

  const car = createCar(brand, model, year_from || null, year_to || null, max_price, max_km || null, fuel || '');
  return NextResponse.json(car, { status: 201 });
}
