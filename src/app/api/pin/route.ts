import { NextRequest, NextResponse } from 'next/server';
import { getSetting, setSetting, getDb } from '@/lib/db';
import crypto from 'crypto';

function hash(pin: string): string {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

export async function GET() {
  const hashStored = getSetting('pin_hash');
  const lengthStored = getSetting('pin_length');
  return NextResponse.json({
    configured: !!hashStored,
    length: lengthStored ? parseInt(lengthStored) : 0,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, pin } = body;

  if (action === 'verify') {
    const stored = getSetting('pin_hash');
    if (!stored) return NextResponse.json({ ok: true });
    return NextResponse.json({ ok: hash(pin) === stored });
  }

  if (action === 'set') {
    if (pin && (pin.length < 4 || pin.length > 10)) {
      return NextResponse.json({ error: 'PIN must be 4-10 characters' }, { status: 400 });
    }
    if (pin) {
      setSetting('pin_hash', hash(pin));
      setSetting('pin_length', pin.length.toString());
    } else {
      const db = getDb();
      db.prepare('DELETE FROM settings WHERE key = ?').run('pin_hash');
      db.prepare('DELETE FROM settings WHERE key = ?').run('pin_length');
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
