'use client';

import { useEffect, useState } from 'react';
import { KeyRound, Lock, Trash2, Car, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const [pinConfigured, setPinConfigured] = useState(false);
  const [showPinForm, setShowPinForm] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState('');

  useEffect(() => {
    fetch('/api/pin').then(r => r.json()).then(data => setPinConfigured(data.configured)).catch(() => {});
  }, []);

  async function handleSetPin(e: React.FormEvent) {
    e.preventDefault();
    setPinError(''); setPinSuccess('');
    if (newPin.length < 4 || newPin.length > 10) { setPinError('PIN must be 4-10 characters'); return; }
    if (newPin !== confirmPin) { setPinError('PINs do not match'); return; }
    try {
      const res = await fetch('/api/pin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'set', pin: newPin }) });
      if (res.ok) {
        setPinConfigured(true); setPinSuccess('PIN updated successfully'); setShowPinForm(false); setNewPin(''); setConfirmPin('');
      } else { const data = await res.json(); setPinError(data.error || 'Error saving PIN'); }
    } catch { setPinError('Error saving PIN'); }
  }

  async function handleRemovePin() {
    if (!confirm('Remove PIN protection?')) return;
    try { await fetch('/api/pin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'set', pin: '' }) }); setPinConfigured(false); setPinSuccess('PIN removed'); }
    catch { setPinError('Error removing PIN'); }
  }

  async function triggerScrape() {
    setScraping(true);
    setScrapeMsg('');
    try {
      const res = await fetch('/api/scrape', { method: 'POST' });
      const data = await res.json();
      setScrapeMsg(data.message || `Found ${data.found} new listings`);
    } catch { setScrapeMsg('Error triggering scrape'); }
    setScraping(false);
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* PIN Protection */}
      <div className="card">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Security</h2>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {pinConfigured ? <Lock size={16} className="text-[var(--ngl-accent)]" /> : <KeyRound size={16} className="text-[var(--ngl-ink-muted)]" />}
            <div>
              <p className="text-sm font-medium">PIN Protection</p>
              <p className="text-xs text-[var(--ngl-ink-muted)]">{pinConfigured ? 'PIN is set' : 'No PIN configured'}</p>
            </div>
          </div>
          <button onClick={() => { setShowPinForm(!showPinForm); setPinError(''); setPinSuccess(''); }} className="btn btn-secondary text-xs">
            {pinConfigured ? 'Change' : 'Set PIN'}
          </button>
        </div>
        {pinSuccess && <p className="text-xs text-[var(--ngl-success)] mb-3">{pinSuccess}</p>}
        {pinError && <p className="text-xs text-red-500 mb-3">{pinError}</p>}
        {showPinForm && (
          <form onSubmit={handleSetPin} className="space-y-3">
            <input type="password" inputMode="numeric" pattern="[0-9]*" value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
              className="input input-plain text-center text-lg tracking-widest" style={{ padding: '.625rem .75rem' }}
              placeholder="New PIN" maxLength={10} autoFocus />
            <input type="password" inputMode="numeric" pattern="[0-9]*" value={confirmPin}
              onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              className="input input-plain text-center text-lg tracking-widest" style={{ padding: '.625rem .75rem' }}
              placeholder="Confirm PIN" maxLength={10} />
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary flex-1">Save PIN</button>
              {pinConfigured && (
                <button type="button" onClick={handleRemovePin} className="btn btn-danger flex-1" title="Remove PIN">
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Cars */}
      <div className="card">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Tracked Cars</h2>
        <p className="text-sm text-[var(--ngl-ink-secondary)] mb-4">
          Configure up to 3 cars to track on Wallapop.
        </p>
        <Link href="/cars" className="btn btn-secondary w-full text-xs">
          <Car size={16} /> Manage Cars
        </Link>
      </div>

      {/* Scrape */}
      <div className="card">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Manual Scrape</h2>
        <p className="text-sm text-[var(--ngl-ink-secondary)] mb-4">
          Trigger an immediate Wallapop search. Auto-scrapes every 12 hours.
        </p>
        <button onClick={triggerScrape} disabled={scraping} className="btn btn-primary w-full text-xs">
          <RefreshCw size={16} className={scraping ? 'animate-spin' : ''} />
          {scraping ? 'Scraping...' : 'Scrape Now'}
        </button>
        {scrapeMsg && <p className="text-xs text-[var(--ngl-ink-secondary)] mt-2">{scrapeMsg}</p>}
      </div>

      {/* About */}
      <div className="card">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">About</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-[var(--ngl-ink-muted)]">App</span><span>TrackWall</span></div>
          <div className="flex justify-between"><span className="text-[var(--ngl-ink-muted)]">Version</span><span>1.0.0</span></div>
          <div className="flex justify-between"><span className="text-[var(--ngl-ink-muted)]">Framework</span><span>Next.js</span></div>
          <div className="flex justify-between"><span className="text-[var(--ngl-ink-muted)]">Database</span><span>SQLite</span></div>
        </div>
      </div>

      {/* Help */}
      <div className="card">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Help</h2>
        <div className="text-sm text-[var(--ngl-ink-secondary)] space-y-2">
          <p>TrackWall monitors Wallapop for up to 3 vehicles. Add cars in the settings, and the system scrapes Wallapop every 12 hours. New listings appear in the feed with AI-verified scores.</p>
          <p className="text-xs text-[var(--ngl-ink-muted)]">All data is stored locally in SQLite on the server. The scraper runs automatically via cron.</p>
        </div>
      </div>
    </div>
  );
}
