'use client';

import { useEffect, useState, useRef } from 'react';
import { Lock, Unlock, KeyRound } from 'lucide-react';

export function PinGate({ children }: { children: React.ReactNode }) {
  const [pinConfigured, setPinConfigured] = useState<boolean | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [settingPin, setSettingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [pinLength, setPinLength] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-verify instantly when PIN reaches the exact stored length
  useEffect(() => {
    if (pinLength && pin.length === pinLength && !verifying) {
      autoVerify(pin);
    }
  }, [pin, pinLength]);

  async function autoVerify(pinToCheck: string) {
    setVerifying(true);
    setError('');
    try {
      const res = await fetch('/api/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', pin: pinToCheck }),
      });
      const data = await res.json();
      if (data.valid) {
        setUnlocked(true);
        sessionStorage.setItem('trackwall_unlocked', 'true');
      } else {
        setError('Wrong PIN');
        setPin('');
        setVerifying(false);
      }
    } catch {
      setError('Error verifying PIN');
      setVerifying(false);
    }
  }

  // On mount, check PIN state
  useEffect(() => {
    if (sessionStorage.getItem('trackwall_unlocked')) {
      setUnlocked(true);
      return;
    }

    fetch('/api/pin')
      .then(r => r.json())
      .then(data => {
        setPinConfigured(data.configured);
        if (data.length) setPinLength(data.length);
        if (!data.configured) {
          setUnlocked(true);
          sessionStorage.setItem('trackwall_unlocked', 'true');
        }
      })
      .catch(() => {
        setPinConfigured(false);
        setUnlocked(true);
      });
  }, []);

  // Focus input
  useEffect(() => {
    if (!unlocked && inputRef.current) inputRef.current.focus();
  }, [unlocked, pinConfigured]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setVerifying(true);

    try {
      const res = await fetch('/api/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', pin }),
      });
      const data = await res.json();
      if (data.valid) {
        setUnlocked(true);
        sessionStorage.setItem('trackwall_unlocked', 'true');
      } else {
        setError('Wrong PIN');
        setPin('');
        setVerifying(false);
      }
    } catch {
      setError('Error verifying PIN');
      setVerifying(false);
    }
  }

  async function handleSetPin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (newPin.length < 4 || newPin.length > 10) {
      setError('PIN must be 4-10 characters');
      return;
    }
    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    try {
      const res = await fetch('/api/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set', pin: newPin }),
      });
      if (res.ok) {
        setSettingPin(false);
        setNewPin('');
        setConfirmPin('');
        setPinConfigured(true);
        setUnlocked(true);
        sessionStorage.setItem('trackwall_unlocked', 'true');
      } else {
        const data = await res.json();
        setError(data.error || 'Error saving PIN');
      }
    } catch {
      setError('Error saving PIN');
    }
  }

  const settingScreen = settingPin || (!pinConfigured && pinConfigured !== null);

  if (unlocked) return <>{children}</>;

  if (pinConfigured === null) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg-primary)]">
        <Lock size={32} className="text-[var(--text-muted)] animate-pulse" />
      </div>
    );
  }

  // First time setup - no PIN configured
  if (!pinConfigured && !settingPin) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-[var(--bg-primary)]">
        <KeyRound size={40} className="text-[var(--accent)] mb-4" />
        <h1 className="text-lg font-bold mb-2">Welcome to TrackWall</h1>
        <p className="text-sm text-[var(--text-secondary)] text-center mb-6">
          Set a PIN to protect your car tracker
        </p>
        <button
          onClick={() => setSettingPin(true)}
          className="btn btn-primary"
        >
          Set PIN
        </button>
        <button
          onClick={() => {
            setUnlocked(true);
            sessionStorage.setItem('trackwall_unlocked', 'true');
          }}
          className="text-sm text-[var(--text-muted)] mt-4 hover:text-[var(--accent)]"
        >
          Skip &mdash; don&apos;t protect
        </button>
      </div>
    );
  }

  // PIN entry screen
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-[var(--bg-primary)]">
      <Lock size={40} className="text-[var(--accent)] mb-4" />
      <h1 className="text-lg font-bold mb-1">TrackWall</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">Enter your PIN</p>

      <form onSubmit={handleVerify} className="w-full max-w-xs">
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          value={pin}
          onChange={e => setPin(e.target.value)}
          className="input text-center text-2xl tracking-widest mb-4"
          style={{ padding: '.625rem .75rem' }}
          placeholder="• • • •"
          maxLength={10}
          autoFocus
        />
        {error && (
          <p className="text-sm text-red-500 text-center mb-4">{error}</p>
        )}
        <button
          type="submit"
          disabled={pin.length < 4 || verifying}
          className="btn btn-primary w-full"
        >
          {verifying ? 'Verifying…' : 'Unlock'}
        </button>
      </form>

      {/* Set/change PIN link */}
      <button
        onClick={() => window.location.href = '/settings'}
        className="text-xs text-[var(--text-muted)] mt-6 hover:text-[var(--accent)]"
      >
        Manage PIN in Settings
      </button>

      {/* Set PIN form */}
      {settingScreen && pinConfigured !== false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-base font-semibold mb-4">Set New PIN</h3>
            <form onSubmit={handleSetPin} className="space-y-3">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                className="input text-center text-lg tracking-widest mb-2"
                style={{ padding: '.625rem .75rem' }}
                placeholder="New PIN"
                maxLength={10}
                autoFocus
              />
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                className="input text-center text-lg tracking-widest mb-2"
                style={{ padding: '.625rem .75rem' }}
                placeholder="Confirm PIN"
                maxLength={10}
              />
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary flex-1">Save PIN</button>
                <button type="button" onClick={() => { setSettingPin(false); setError(''); }} className="btn btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
