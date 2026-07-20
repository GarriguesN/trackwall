'use client';

import { useEffect, useState } from 'react';
import { Heart, ExternalLink, Trash2, Car } from 'lucide-react';
import Link from 'next/link';

interface Listing {
  id: number; url: string; title: string; price: number; year: number;
  km: string; image_url: string | null; favorite: number; source_car: string;
}

export default function FavoritesPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch('/api/listings');
    const data = await res.json();
    setListings(data.filter((l: Listing) => l.favorite));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleFav(id: number) {
    await fetch('/api/listings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'favorite', id }) });
    load();
  }

  if (loading) return <div className="skeleton h-48 w-full rounded-lg" />;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">Favorites</h1>

      {listings.length === 0 && (
        <div className="card text-center py-12">
          <Heart size={48} className="mx-auto mb-3 text-[var(--ngl-ink-muted)]" />
          <p className="text-[var(--ngl-ink-secondary)]">No favorites yet</p>
          <p className="text-xs text-[var(--ngl-ink-muted)]">Star listings from the feed to save them here</p>
        </div>
      )}

      {listings.map(listing => (
        <div key={listing.id} className="card flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{listing.title}</p>
            <p className="text-xs text-[var(--ngl-ink-muted)]">{listing.source_car}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-base font-bold text-[var(--ngl-accent)]">{listing.price}€</span>
              {listing.year > 0 && <span className="text-xs">{listing.year}</span>}
              {listing.km && <span className="text-xs">{listing.km} km</span>}
            </div>
          </div>
          <div className="flex gap-1">
            <a href={listing.url} target="_blank" className="btn btn-ghost p-2 min-h-0">
              <ExternalLink size={16} />
            </a>
            <button onClick={() => toggleFav(listing.id)} className="btn btn-ghost p-2 min-h-0">
              <Heart size={16} className="fill-[var(--ngl-accent)] text-[var(--ngl-accent)]" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
