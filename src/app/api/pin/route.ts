import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSetting, setSetting, getDb } from '@/lib/db';

function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, pin } = body;

    if (action === 'verify') {
      const stored = getSetting('pin_hash');
      if (!stored) return NextResponse.json({ valid: true });
      return NextResponse.json({ valid: hashPin(pin) === stored });
    }

    if (action === 'set') {
      if (!pin || pin.length < 4 || pin.length > 10) {
        return NextResponse.json({ error: 'PIN must be 4-10 characters' }, { status: 400 });
      }
      if (pin) {
        setSetting('pin_hash', hashPin(pin));
        setSetting('pin_length', pin.length.toString());
      } else {
        const db = getDb();
        db.prepare('DELETE FROM settings WHERE key = ?').run('pin_hash');
        db.prepare('DELETE FROM settings WHERE key = ?').run('pin_length');
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const stored = getSetting('pin_hash');
    const lengthRow = getSetting('pin_length');
    return NextResponse.json({
      configured: !!stored,
      length: lengthRow ? parseInt(lengthRow) : null,
    });
  } catch {
    return NextResponse.json({ configured: false, length: null });
  }
}
