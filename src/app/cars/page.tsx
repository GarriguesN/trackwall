'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Car, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';

interface Car {
  id: number; brand: string; model: string; year_from: number | null;
  year_to: number | null; max_price: number; max_km: number | null;
  fuel: string; enabled: number; created_at: string;
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
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="input text-sm" placeholder="Brand *" required />
            </div>
            <div className="relative">
              <input value={form.model} onChange={e => setForm({...form, model: e.target.value})} className="input text-sm" placeholder="Model *" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <input value={form.year_from} onChange={e => setForm({...form, year_from: e.target.value})} className="input input-plain text-sm" placeholder="Year from" type="number" />
            </div>
            <div className="relative">
              <input value={form.year_to} onChange={e => setForm({...form, year_to: e.target.value})} className="input input-plain text-sm" placeholder="Year to" type="number" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <input value={form.max_price} onChange={e => setForm({...form, max_price: e.target.value})} className="input text-sm" placeholder="Max price (€) *" type="number" required />
            </div>
            <div className="relative">
              <input value={form.max_km} onChange={e => setForm({...form, max_km: e.target.value})} className="input input-plain text-sm" placeholder="Max km" type="number" />
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
