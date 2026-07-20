'use client';

import { Home, Car, Settings, Search, Heart } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Feed', icon: Home },
  { href: '/cars', label: 'Cars', icon: Car },
  { href: '/favorites', label: 'Favs', icon: Heart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function NavBar() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] bg-[var(--ngl-bg)]/95 backdrop-blur-md border-t-2 border-[var(--ngl-accent)]">
        <div className="flex items-center justify-around h-12">
          {LINKS.map(link => {
            const active = isActive(link.href);
            return (
              <Link key={link.href} href={link.href}
                className={`flex-1 h-full flex items-center justify-center transition-colors ${active ? 'text-[var(--ngl-accent)]' : 'text-[var(--ngl-ink-muted)]'}`}
                style={active ? { background: 'rgba(195, 66, 63, 0.1)' } : {}}
              >
                <link.icon size={24} />
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop top nav */}
      <nav className="hidden sm:block sticky top-0 z-50 bg-[var(--ngl-bg)] border-b border-[var(--ngl-border)]">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-12">
          <div className="flex items-center gap-1">
            <Car size={20} className="text-[var(--ngl-accent)]" />
            <span className="font-bold text-sm">TrackWall</span>
          </div>
          <div className="flex items-center gap-1">
            {LINKS.map(link => {
              const active = isActive(link.href);
              return (
                <Link key={link.href} href={link.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    active ? 'bg-[var(--ngl-bg-alt)] text-[var(--ngl-accent)]' : 'text-[var(--ngl-ink-secondary)] hover:bg-[var(--ngl-bg-alt)]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
