'use client';

import { useEffect, useState, useCallback } from 'react';
import { Lock, Car } from 'lucide-react';

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function PinGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'pin' | 'unlocked'>('loading');
  const [pinInput, setPinInput] = useState('');
  const [pinLength, setPinLength] = useState(0);
  const [error, setError] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [setupPin, setSetupPin] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('trackwall_unlocked')) {
      setState('unlocked');
      return;
    }
    fetch('/api/pin').then(r => r.json()).then(data => {
      if (data.configured) {
        setPinLength(data.length || 0);
        setState('pin');
      } else {
        setShowSetup(true);
        setState('pin');
      }
    }).catch(() => setState('unlocked'));
  }, []);

  const handlePinChange = useCallback(async (value: string) => {
    const digits = value.replace(/\D/g, '');
    setPinInput(digits);
    setError('');

    if (pinLength > 0 && digits.length === pinLength) {
      const hash = await sha256(digits);
      const res = await fetch('/api/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', pin: digits }),
      });
      const data = await res.json();
      if (data.ok) {
        sessionStorage.setItem('trackwall_unlocked', 'true');
        setState('unlocked');
      } else {
        setError('Wrong PIN');
        setPinInput('');
      }
    }
  }, [pinLength]);

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (setupPin.length < 4 || setupPin.length > 10) {
      setError('PIN must be 4-10 digits');
      return;
    }
    if (setupPin !== setupConfirm) {
      setError('PINs do not match');
      return;
    }
    const res = await fetch('/api/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set', pin: setupPin }),
    });
    if (res.ok) {
      sessionStorage.setItem('trackwall_unlocked', 'true');
      setState('unlocked');
    } else {
      const data = await res.json();
      setError(data.error || 'Error saving PIN');
    }
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ngl-bg)]">
        <div className="skeleton w-12 h-12 rounded-full" />
      </div>
    );
  }

  if (state === 'unlocked') return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--ngl-bg)] px-4">
      <div className="card max-w-sm w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-[var(--ngl-accent)]/10 flex items-center justify-center">
            <Car size={32} className="text-[var(--ngl-accent)]" />
          </div>
        </div>
        <h1 className="text-xl font-bold">TrackWall</h1>

        {showSetup ? (
          <form onSubmit={handleSetup} className="space-y-3">
            <p className="text-sm text-[var(--ngl-ink-secondary)]">Set a PIN to protect your tracker</p>
            <input type="password" inputMode="numeric" pattern="[0-9]*"
              value={setupPin} onChange={e => setSetupPin(e.target.value.replace(/\D/g, ''))}
              className="input input-plain text-center text-lg tracking-widest"
              placeholder="New PIN" maxLength={10} autoFocus />
            <input type="password" inputMode="numeric" pattern="[0-9]*"
              value={setupConfirm} onChange={e => setSetupConfirm(e.target.value.replace(/\D/g, ''))}
              className="input input-plain text-center text-lg tracking-widest"
              placeholder="Confirm PIN" maxLength={10} />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button type="submit" className="btn btn-primary w-full"><Lock size={16} /> Set PIN</button>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--ngl-ink-secondary)]">Enter PIN to unlock</p>
            <input type="password" inputMode="numeric" pattern="[0-9]*"
              value={pinInput} onChange={e => handlePinChange(e.target.value)}
              className="input input-plain text-center text-lg tracking-widest"
              placeholder="PIN" maxLength={10} autoFocus />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
