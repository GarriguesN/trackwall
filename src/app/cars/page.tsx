'use client';

import { useEffect, useState, useRef } from 'react';
import { Plus, Trash2, Car, ToggleLeft, ToggleRight, AlertCircle, Search, Loader2, X, Calendar, Euro, Gauge } from 'lucide-react';

interface Car {
  id: number; brand: string; model: string; year_from: number | null;
  year_to: number | null; max_price: number; max_km: number | null;
  fuel: string; enabled: number; created_at: string;
}

function BrandInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [logoUrl, setLogoUrl] = useState('');
  const [allLogos, setAllLogos] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value.trim()) { setLogoUrl(''); setAllLogos([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/logo?name=${encodeURIComponent(value.trim())}`);
        if (res.ok) { const d = await res.json(); setLogoUrl(d.logo || ''); setAllLogos(d.logos || []); }
      } catch {}
      setSearching(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    if (!showModal) return;
    function handleClick(e: MouseEvent) { if (modalRef.current && !modalRef.current.contains(e.target as Node)) setShowModal(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showModal]);

  return (
    <>
      <div className="relative">
        <input value={value} onChange={e => onChange(e.target.value)} className="input w-full" placeholder="Brand *" required style={{ paddingLeft: '2.5rem' }} />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => allLogos.length > 0 && setShowModal(true)} title={allLogos.length > 0 ? `Choose logo (${allLogos.length} available)` : 'Searching logo...'}>
          {searching ? <Loader2 size={16} className="animate-spin text-[var(--text-muted)]" />
          : logoUrl ? <img src={logoUrl} alt="" className="w-5 h-5 rounded object-contain hover:opacity-80 transition-opacity" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          : <Search size={16} className="text-[var(--text-muted)]" />}
        </div>
      </div>
      {showModal && allLogos.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div ref={modalRef} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl max-w-sm w-full p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Select Logo</h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={18} /></button>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-4">Choose the best logo for &quot;{value}&quot;:</p>
            <div className="grid grid-cols-3 gap-3">
              {allLogos.map((url, i) => (
                <button key={i} onClick={() => { setLogoUrl(url); setShowModal(false); }}
                  className={`flex items-center justify-center p-3 rounded-lg border transition-all ${url === logoUrl ? 'border-[var(--accent)] bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]' : 'border-[var(--border-color)] hover:border-[var(--accent)] hover:bg-[var(--bg-secondary)]'}`}>
                  <img src={url} alt={`Logo ${i + 1}`} className="w-10 h-10 object-contain" onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%239ca3af\" stroke-width=\"2\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 8v4M12 16h.01\"/></svg>'; }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function CarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ brand: '', model: '', year_from: '', year_to: '', max_price: '', max_km: '', fuel: '' });

  async function load() {
    const res = await fetch('/api/cars');
    const data = await res.json();
    setCars(data.cars);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/cars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand: form.brand, model: form.model,
        year_from: form.year_from ? parseInt(form.year_from) : null,
        year_to: form.year_to ? parseInt(form.year_to) : null,
        max_price: parseFloat(form.max_price),
        max_km: form.max_km ? parseInt(form.max_km) : null,
        fuel: form.fuel,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Error creating car');
      return;
    }
    setForm({ brand: '', model: '', year_from: '', year_to: '', max_price: '', max_km: '', fuel: '' });
    setShowForm(false);
    load();
  }

  async function toggleCar(id: number, enabled: number) {
    await fetch(`/api/cars/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: enabled ? 0 : 1 }) });
    load();
  }

  async function deleteCar(id: number) {
    if (!confirm('Delete this car and all its listings?')) return;
    await fetch(`/api/cars/${id}`, { method: 'DELETE' });
    load();
  }

  if (loading) return <div className="skeleton h-48 w-full rounded-lg" />;

  const activeCount = cars.filter(c => c.enabled).length;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Cars</h1>
        {activeCount < 3 && (
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary text-xs">
            <Plus size={16} /> Add Car
          </button>
        )}
      </div>

      {activeCount >= 3 && (
        <div className="card flex items-center gap-2 text-sm text-[var(--ngl-ink-secondary)]">
          <AlertCircle size={16} className="text-[var(--ngl-accent)]" />
          Maximum 3 active cars reached. Disable one to add another.
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-3">
          <p className="text-xs font-semibold text-[var(--ngl-ink-secondary)] uppercase tracking-wider">New Search</p>

          {/* Brand + Model row */}
          <div className="grid grid-cols-2 gap-3">
            <BrandInput value={form.brand} onChange={v => setForm({...form, brand: v})} />
            <div className="relative">
              <input value={form.model} onChange={e => setForm({...form, model: e.target.value})} className="input input-plain text-sm" style={{ padding: '.625rem .75rem' }} placeholder="Model *" required />
            </div>
          </div>

          {/* Year from + Year to */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ngl-ink-muted)] pointer-events-none" />
              <input value={form.year_from} onChange={e => setForm({...form, year_from: e.target.value})} className="input text-sm" placeholder="Year from" type="number" />
            </div>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ngl-ink-muted)] pointer-events-none" />
              <input value={form.year_to} onChange={e => setForm({...form, year_to: e.target.value})} className="input text-sm" placeholder="Year to" type="number" />
            </div>
          </div>

          {/* Price + KM */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Euro size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ngl-ink-muted)] pointer-events-none" />
              <input value={form.max_price} onChange={e => setForm({...form, max_price: e.target.value})} className="input text-sm" placeholder="Max price (€) *" type="number" required />
            </div>
            <div className="relative">
              <Gauge size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ngl-ink-muted)] pointer-events-none" />
              <input value={form.max_km} onChange={e => setForm({...form, max_km: e.target.value})} className="input text-sm" placeholder="Max km" type="number" />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" className="btn btn-primary w-full"><Car size={16} /> Add Car</button>
        </form>
      )}

      {cars.length === 0 && !showForm && (
        <div className="card text-center py-12">
          <Car size={48} className="mx-auto mb-3 text-[var(--ngl-ink-muted)]" />
          <p className="text-[var(--ngl-ink-secondary)]">No cars configured</p>
          <p className="text-xs text-[var(--ngl-ink-muted)]">Add up to 3 cars to start tracking</p>
        </div>
      )}

      <div className="space-y-2">
        {cars.map(car => (
          <div key={car.id} className="card flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{car.brand} {car.model}</p>
              <p className="text-xs text-[var(--ngl-ink-muted)]">
                Max {car.max_price}€{car.year_from ? ` · ${car.year_from}${car.year_to ? `-${car.year_to}` : '+'}` : ''}{car.max_km ? ` · ${car.max_km}km` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleCar(car.id, car.enabled)} className="btn btn-ghost p-2 min-h-0" title={car.enabled ? 'Disable' : 'Enable'}>
                {car.enabled ? <ToggleRight size={20} className="text-[var(--ngl-success)]" /> : <ToggleLeft size={20} className="text-[var(--ngl-ink-muted)]" />}
              </button>
              <button onClick={() => deleteCar(car.id)} className="btn btn-ghost p-2 min-h-0 text-red-500" title="Delete">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
