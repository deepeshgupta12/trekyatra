import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "./schema";

const expoDb = SQLite.openDatabaseSync("trekyatra.db");

export const db = drizzle(expoDb, { schema });

export async function initDb() {
  await expoDb.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS cms_pages (
      slug TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      page_type TEXT NOT NULL,
      hero_image_url TEXT,
      trek_state TEXT,
      trek_difficulty TEXT,
      trek_duration TEXT,
      trek_altitude TEXT,
      trek_season TEXT,
      body_json TEXT,
      content_html TEXT,
      content_json TEXT,
      seo_description TEXT,
      synced_at TEXT NOT NULL,
      is_downloaded INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sync_meta (
      id INTEGER PRIMARY KEY NOT NULL,
      last_sync_at TEXT,
      total_pages INTEGER DEFAULT 0
    );

    INSERT OR IGNORE INTO sync_meta (id, last_sync_at, total_pages) VALUES (1, NULL, 0);
  `);

  // Migrate existing DBs — SQLite ADD COLUMN ignores if column exists via try/catch
  for (const col of ["content_html TEXT", "content_json TEXT"]) {
    try {
      await expoDb.execAsync(`ALTER TABLE cms_pages ADD COLUMN ${col};`);
    } catch {
      // Column already exists — safe to ignore
    }
  }
}
