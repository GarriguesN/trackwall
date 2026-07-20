import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function POST() {
  try {
    const output = execSync(
      '/root/venv-wallapop/bin/python3 /root/.hermes/scripts/trackwall-scraper.py',
      { timeout: 120000, env: { ...process.env, DB_PATH: process.env.DB_PATH || '/opt/trackwall/data/trackwall.db' } }
    ).toString().trim();

    // Parse summary from last line, e.g. "✓ done — cars=2 scanned=15 inserted=3 updated=1 skipped=2"
    const summaryMatch = output.match(/✓ done — (.+)/);
    const message = summaryMatch ? `Scraped successfully: ${summaryMatch[1]}` : output;
    return NextResponse.json({ found: true, message, raw: output });
  } catch (e: any) {
    console.error('Scrape error:', e.stderr?.toString() || e.message);
    return NextResponse.json({
      found: false,
      message: `Scrape failed: ${e.stderr?.toString().split('\n').filter(Boolean).slice(-3).join('; ') || e.message}`,
    }, { status: 500 });
  }
}
