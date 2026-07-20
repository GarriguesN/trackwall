import type { Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { PinGate } from '@/components/PinGate';
import { NavBar } from '@/components/NavBar';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#c3423f',
};

export const metadata = {
  title: 'TrackWall',
  description: 'Wallapop car tracker — monitor up to 3 vehicles',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'TrackWall' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico" />
      </head>
      <body className="min-h-dvh flex flex-col">
        <div className="app-container">
          <ThemeProvider>
            <PinGate>
              <NavBar />
              <main className="flex-1 w-full mx-auto px-4 sm:px-6 py-6 pb-[calc(3rem+env(safe-area-inset-bottom))] sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                {children}
              </main>
            </PinGate>
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
