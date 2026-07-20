import { NextRequest, NextResponse } from 'next/server';
import { getCar, updateCar, deleteCar } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const car = getCar(parseInt(id));
  if (!car) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(car);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  updateCar(parseInt(id), body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteCar(parseInt(id));
  return NextResponse.json({ ok: true });
}
