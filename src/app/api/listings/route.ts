import { NextRequest, NextResponse } from 'next/server';
import { getFeed, toggleFavorite, toggleRemoved, updateListingNotes, getListingByUrl, getPriceHistory } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const id = searchParams.get('id');
  const url = searchParams.get('url');

  if (action === 'history' && url) {
    return NextResponse.json(getPriceHistory(url));
  }

  const listings = getFeed();
  return NextResponse.json(listings);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, id, notes } = body;

  if (action === 'favorite' && id) {
    toggleFavorite(parseInt(id));
    return NextResponse.json({ ok: true });
  }
  if (action === 'remove' && id) {
    toggleRemoved(parseInt(id));
    return NextResponse.json({ ok: true });
  }
  if (action === 'notes' && id && notes !== undefined) {
    updateListingNotes(parseInt(id), notes);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
