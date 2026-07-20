import { NextResponse } from 'next/server';
import { listCars, upsertListing, getDb } from '@/lib/db';

// Headless fetch of Wallapop search results
async function searchWallapop(query: string, maxPrice: number, yearFrom?: number, yearTo?: number) {
  const url = `https://es.wallapop.com/search?keywords=${encodeURIComponent(query)}&order_by=newest&min_price=100&max_price=${maxPrice}`;
  
  const html = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0' },
  }).then(r => r.text());

  // Extract JSON data from script tags
  const matches = html.match(/<script[^>]*>window\.__INITIAL_STATE__\s*=\s*({.*?});<\/script>/);
  if (!matches) return [];

  const data = JSON.parse(matches[1]);
  const items = data?.search?.search?.section?.items || [];
  
  return items
    .filter((item: any) => {
      const price = item.price?.amount || 0;
      const year = item.attributes?.year || 0;
      if (yearFrom && year < yearFrom) return false;
      if (yearTo && year > yearTo) return false;
      if (price > maxPrice) return false;
      return true;
    })
    .map((item: any) => ({
      url: `https://es.wallapop.com/item/${item.id}`,
      title: item.title || '',
      price: item.price?.amount || 0,
      year: item.attributes?.year || 0,
      km: item.attributes?.kilometers || '?',
      description: item.description || '',
      image_url: item.images?.[0]?.url || item.resources?.[0]?.url || null,
    }));
}

export async function POST() {
  const cars = listCars().filter(c => c.enabled);
  let total = 0;

  for (const car of cars) {
    const query = `${car.brand} ${car.model}`;
    try {
      const items = await searchWallapop(query, car.max_price, car.year_from ?? undefined, car.year_to ?? undefined);
      
      for (const item of items) {
        // Simple scoring
        let score = 5;
        if (item.price <= car.max_price * 0.5) score += 2;
        if (item.km !== '?' && parseInt(String(item.km)) < 100000) score += 1;
        if (item.description && item.description.length > 100) score += 1;

        upsertListing(
          car.id, item.url, item.title, item.price,
          item.year, String(item.km), item.description || '',
          item.image_url, Math.min(10, score),
          `${car.brand} ${car.model}`
        );
        total++;
      }
    } catch (e) {
      console.error(`Error scraping ${query}:`, e);
    }
  }

  return NextResponse.json({ found: total, message: `Scraped ${cars.length} cars, found ${total} listings` });
}
