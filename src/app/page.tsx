'use client';

import { useEffect, useState } from 'react';
import { Heart, Trash2, ExternalLink, TrendingDown, Clock, Car } from 'lucide-react';

interface Listing {
  id: number; car_id: number; url: string; title: string; price: number;
  year: number; km: string; description: string; image_url: string | null;
  score: number; source_car: string; first_seen: string; last_price: number | null;
  favorite: number; removed: number; notes: string;
}

export default function FeedPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'favs'>('all');

  async function load() {
    const res = await fetch('/api/listings');
    const data = await res.json();
    setListings(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleFav(id: number) {
    await fetch('/api/listings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'favorite', id }) });
    load();
  }

  async function toggleRemoved(id: number) {
    await fetch('/api/listings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remove', id }) });
    load();
  }

  const filtered = listings.filter(l => {
    if (filter === 'favs') return l.favorite;
    return true;
  });

  const newCount = listings.filter(l => new Date(l.first_seen).getTime() > Date.now() - 86400000).length;

  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton h-12 w-full rounded-lg" />
      {[1,2,3].map(i => <div key={i} className="skeleton h-32 w-full rounded-lg" />)}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Feed</h1>
        <div className="flex gap-1">
          {(['all', 'new', 'favs'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${filter === f ? 'bg-[var(--ngl-accent)] text-white' : 'bg-[var(--ngl-bg-alt)] text-[var(--ngl-ink-secondary)]'}`}
            >
              {f}{f === 'new' && newCount > 0 ? ` (${newCount})` : ''}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="card text-center py-12">
          <Car size={48} className="mx-auto mb-3 text-[var(--ngl-ink-muted)]" />
          <p className="text-[var(--ngl-ink-secondary)]">No listings found</p>
          <p className="text-xs text-[var(--ngl-ink-muted)]">Add cars in Settings and wait for the next scrape</p>
        </div>
      )}

      {filtered.map(listing => {
        const isNew = new Date(listing.first_seen).getTime() > Date.now() - 86400000;
        const priceDrop = listing.last_price && listing.last_price > listing.price;
        return (
          <div key={listing.id} className={`card relative ${listing.favorite ? 'ring-2 ring-[var(--ngl-accent)]' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {listing.image_url && (
                    <img src={listing.image_url} alt="" className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{listing.title}</p>
                    <p className="text-xs text-[var(--ngl-ink-muted)]">{listing.source_car}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-lg font-bold text-[var(--ngl-accent)]">{listing.price}€</span>
                  {listing.year > 0 && <span className="text-xs text-[var(--ngl-ink-secondary)]">{listing.year}</span>}
                  {listing.km && listing.km !== '?' && <span className="text-xs text-[var(--ngl-ink-secondary)]">{listing.km} km</span>}
                </div>
                {priceDrop && (
                  <p className="text-xs text-[var(--ngl-success)] flex items-center gap-1 mt-1">
                    <TrendingDown size={12} /> Price dropped from {listing.last_price}€
                  </p>
                )}
                {listing.description && (
                  <p className="text-xs text-[var(--ngl-ink-secondary)] mt-1 truncate">{listing.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`badge text-[10px] ${listing.score >= 7 ? 'bg-[var(--ngl-success)]/10 text-[var(--ngl-success)]' : listing.score >= 4 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                    {listing.score}/10
                  </span>
                  {isNew && <span className="badge text-[10px] bg-[var(--ngl-accent)]/10 text-[var(--ngl-accent)]">NEW</span>}
                  {listing.last_price && listing.last_price > listing.price && (
                    <span className="badge text-[10px] bg-[var(--ngl-success)]/10 text-[var(--ngl-success)]">PRICE DROP</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <a href={listing.url} target="_blank" rel="noopener noreferrer"
                  className="btn btn-ghost p-2 min-h-0" title="Open in Wallapop">
                  <ExternalLink size={16} />
                </a>
                <button onClick={() => toggleFav(listing.id)}
                  className="btn btn-ghost p-2 min-h-0" title={listing.favorite ? 'Unfavorite' : 'Favorite'}>
                  <Heart size={16} className={listing.favorite ? 'fill-[var(--ngl-accent)] text-[var(--ngl-accent)]' : ''} />
                </button>
                <button onClick={() => toggleRemoved(listing.id)}
                  className="btn btn-ghost p-2 min-h-0 text-red-500" title="Remove">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
