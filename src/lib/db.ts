import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || '/opt/trackwall/data/trackwall.db';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      year_from INTEGER,
      year_to INTEGER,
      max_price REAL NOT NULL,
      max_km INTEGER,
      fuel TEXT DEFAULT '',
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      car_id INTEGER REFERENCES cars(id),
      url TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      price REAL NOT NULL,
      year INTEGER,
      km TEXT,
      description TEXT,
      image_url TEXT,
      score INTEGER DEFAULT 5,
      ai_verified INTEGER DEFAULT 0,
      source_car TEXT NOT NULL,
      first_seen TEXT DEFAULT (datetime('now')),
      last_seen TEXT DEFAULT (datetime('now')),
      last_price REAL,
      removed INTEGER DEFAULT 0,
      favorite INTEGER DEFAULT 0,
      notes TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_url TEXT NOT NULL,
      price REAL NOT NULL,
      recorded_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // v1.1: Add columns if missing
  try { db.exec("ALTER TABLE listings ADD COLUMN removed INTEGER DEFAULT 0"); } catch {}
  try { db.exec("ALTER TABLE listings ADD COLUMN favorite INTEGER DEFAULT 0"); } catch {}
  try { db.exec("ALTER TABLE listings ADD COLUMN notes TEXT DEFAULT ''"); } catch {}
  try { db.exec("ALTER TABLE listings ADD COLUMN last_price REAL"); } catch {}
  try { db.exec("ALTER TABLE listings ADD COLUMN image_url TEXT"); } catch {}
}

// ========== Settings ==========
export function getSetting(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  getDb().prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

// ========== Cars ==========
export interface Car {
  id: number;
  brand: string;
  model: string;
  year_from: number | null;
  year_to: number | null;
  max_price: number;
  max_km: number | null;
  fuel: string;
  enabled: number;
  created_at: string;
}

export function listCars(): Car[] {
  return getDb().prepare('SELECT * FROM cars ORDER BY created_at DESC').all() as Car[];
}

export function getCar(id: number): Car | null {
  return getDb().prepare('SELECT * FROM cars WHERE id = ?').get(id) as Car | null;
}

export function findCarByBrandModel(brand: string, model: string): Car | null {
  return getDb().prepare(
    'SELECT * FROM cars WHERE LOWER(brand) = LOWER(?) AND LOWER(model) = LOWER(?)'
  ).get(brand, model) as Car | null;
}

export function createCar(brand: string, model: string, yearFrom: number | null, yearTo: number | null, maxPrice: number, maxKm: number | null, fuel: string): Car {
  const result = getDb().prepare(
    'INSERT INTO cars (brand, model, year_from, year_to, max_price, max_km, fuel) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(brand, model, yearFrom, yearTo, maxPrice, maxKm, fuel);
  return getCar(result.lastInsertRowid as number)!;
}

export function updateCar(id: number, data: Partial<Car>): void {
  const fields = Object.keys(data).filter(k => k !== 'id').map(k => `${k} = ?`).join(', ');
  const values = Object.entries(data).filter(([k]) => k !== 'id').map(([, v]) => v);
  getDb().prepare(`UPDATE cars SET ${fields} WHERE id = ?`).run(...values, id);
}

export function deleteCar(id: number): void {
  getDb().prepare('DELETE FROM listings WHERE car_id = ?').run(id);
  getDb().prepare('DELETE FROM cars WHERE id = ?').run(id);
}

// ========== Listings ==========
export interface Listing {
  id: number;
  car_id: number;
  url: string;
  title: string;
  price: number;
  year: number;
  km: string;
  description: string;
  image_url: string | null;
  score: number;
  ai_verified: number;
  source_car: string;
  first_seen: string;
  last_seen: string;
  last_price: number | null;
  removed: number;
  favorite: number;
  notes: string;
}

export function getFeed(): Listing[] {
  return getDb().prepare(
    `SELECT l.*, c.brand || ' ' || c.model as car_name
     FROM listings l
     LEFT JOIN cars c ON l.car_id = c.id
     WHERE l.removed = 0
     ORDER BY l.first_seen DESC, l.price ASC`
  ).all() as Listing[];
}

export function getListingByUrl(url: string): Listing | null {
  return getDb().prepare('SELECT * FROM listings WHERE url = ?').get(url) as Listing | null;
}

export function upsertListing(carId: number, url: string, title: string, price: number, year: number, km: string, desc: string, imageUrl: string | null, score: number, sourceCar: string): void {
  const existing = getListingByUrl(url);
  if (existing) {
    getDb().prepare(
      'UPDATE listings SET last_seen = datetime(\'now\'), price = ?, last_price = CASE WHEN ? != price THEN price ELSE last_price END, title = ?, year = ?, km = ?, description = ?, image_url = ?, score = ? WHERE url = ?'
    ).run(price, price, title, year, km, desc, imageUrl, score, url);
    // Track price change
    if (existing.price !== price) {
      getDb().prepare('INSERT INTO price_history (listing_url, price) VALUES (?, ?)').run(url, price);
    }
  } else {
    getDb().prepare(
      'INSERT INTO listings (car_id, url, title, price, year, km, description, image_url, score, source_car) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(carId, url, title, price, year, km, desc, imageUrl, score, sourceCar);
  }
}

export function toggleFavorite(id: number): void {
  getDb().prepare('UPDATE listings SET favorite = CASE WHEN favorite THEN 0 ELSE 1 END WHERE id = ?').run(id);
}

export function toggleRemoved(id: number): void {
  getDb().prepare('UPDATE listings SET removed = CASE WHEN removed THEN 0 ELSE 1 END WHERE id = ?').run(id);
}

export function updateListingNotes(id: number, notes: string): void {
  getDb().prepare('UPDATE listings SET notes = ? WHERE id = ?').run(notes, id);
}

export function getPriceHistory(url: string): { price: number; recorded_at: string }[] {
  return getDb().prepare('SELECT price, recorded_at FROM price_history WHERE listing_url = ? ORDER BY recorded_at ASC').all(url) as { price: number; recorded_at: string }[];
}

// ========== Stats ==========
export function getStats() {
  const db = getDb();
  const cars = listCars();
  const totalListings = (db.prepare('SELECT COUNT(*) as c FROM listings WHERE removed = 0').get() as any).c;
  const newToday = (db.prepare("SELECT COUNT(*) as c FROM listings WHERE first_seen >= datetime('now', '-1 day') AND removed = 0").get() as any).c;
  const favorites = (db.prepare('SELECT COUNT(*) as c FROM listings WHERE favorite = 1 AND removed = 0').get() as any).c;
  const activeCars = cars.filter(c => c.enabled).length;
  return { cars: cars.length, activeCars, totalListings, newToday, favorites };
}
