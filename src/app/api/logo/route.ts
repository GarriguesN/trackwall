import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const TLDS = ['.com', '.es', '.io', '.org', '.net', '.app', '.dev', '.co', '.ai',
  '.uk', '.de', '.fr', '.it', '.eu', '.info', '.online', '.xyz', '.me',
  '.design', '.cloud', '.tech', '.digital', '.software'];
const MAX_RESULTS = 20;

function generateDomains(name: string): string[] {
  const domains: string[] = [];
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  if (slug) domains.push(slug);
  const words = name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 0);
  words.forEach(w => { if (w.length > 2 && !domains.includes(w)) domains.push(w); });
  if (words.length >= 2) {
    for (let len = 1; len <= Math.min(words.length, 3); len++) {
      for (let start = 0; start <= words.length - len; start++) {
        const combo = words.slice(start, start + len).join('');
        if (combo.length > 2 && !domains.includes(combo)) domains.push(combo);
      }
    }
  }
  domains.forEach(d => { ['get', 'go', 'my', 'the', 'app'].forEach(pre => { const pd = pre + d; if (!domains.includes(pd)) domains.push(pd); }); });
  return [...new Set(domains)].filter(d => d.length > 2);
}

async function searchFavicons(domains: string[]): Promise<string[]> {
  const found: string[] = [];
  for (const domain of domains) {
    for (const tld of TLDS) {
      const fullDomain = domain.includes('.') ? domain : domain + tld;
      try {
        const url = `https://www.google.com/s2/favicons?domain=${fullDomain}&sz=64`;
        const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const blob = await res.blob();
          if (blob.size > 200 && !found.includes(url)) found.push(url);
        }
      } catch {}
      if (found.length >= MAX_RESULTS) break;
    }
    if (found.length >= MAX_RESULTS) break;
  }
  return found;
}

export async function GET(request: NextRequest) {
  try {
    const name = request.nextUrl.searchParams.get('name');
    if (!name || !name.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });
    const trimmed = name.trim();

    const db = getDb();
    // Ensure logos table exists
    db.exec(`CREATE TABLE IF NOT EXISTS logos (name TEXT PRIMARY KEY, logo_url TEXT DEFAULT '', candidates TEXT DEFAULT '[]', updated_at TEXT DEFAULT (datetime('now')))`);

    const cached = db.prepare('SELECT logo_url, candidates FROM logos WHERE name = ?').get(trimmed) as any;
    if (cached?.candidates && cached.candidates !== '[]') {
      return NextResponse.json({ logo: cached.logo_url, logos: JSON.parse(cached.candidates) });
    }

    const domains = generateDomains(trimmed);
    const logos = await searchFavicons(domains);
    const primary = logos[0] || '';
    db.prepare('INSERT OR REPLACE INTO logos (name, logo_url, candidates, updated_at) VALUES (?, ?, ?, datetime(\'now\'))').run(trimmed, primary, JSON.stringify(logos));
    return NextResponse.json({ logo: primary, logos });
  } catch {
    return NextResponse.json({ logo: '', logos: [] });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { name, logoUrl } = await request.json();
    if (!name || !logoUrl) return NextResponse.json({ error: 'name and logoUrl required' }, { status: 400 });
    const db = getDb();
    db.exec(`CREATE TABLE IF NOT EXISTS logos (name TEXT PRIMARY KEY, logo_url TEXT DEFAULT '', candidates TEXT DEFAULT '[]', updated_at TEXT DEFAULT (datetime('now')))`);
    const existing = db.prepare('SELECT candidates FROM logos WHERE name = ?').get(name.trim()) as any;
    let candidates: string[] = existing ? JSON.parse(existing.candidates) : [];
    if (!candidates.includes(logoUrl)) candidates = [logoUrl, ...candidates.slice(0, 19)];
    db.prepare('INSERT OR REPLACE INTO logos (name, logo_url, candidates, updated_at) VALUES (?, ?, ?, datetime(\'now\'))').run(name.trim(), logoUrl, JSON.stringify(candidates));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
