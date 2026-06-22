import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const cmsPages = sqliteTable("cms_pages", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  pageType: text("page_type").notNull(),
  heroImageUrl: text("hero_image_url"),
  trekState: text("trek_state"),
  trekDifficulty: text("trek_difficulty"),
  trekDuration: text("trek_duration"),
  trekAltitude: text("trek_altitude"),
  trekSeason: text("trek_season"),
  bodyJson: text("body_json"),
  contentHtml: text("content_html"),       // full HTML for packing/permits/costs tabs
  contentJson: text("content_json"),       // serialised content_json object
  seoDescription: text("seo_description"),
  syncedAt: text("synced_at").notNull(),
  isDownloaded: integer("is_downloaded", { mode: "boolean" }).default(false),
});

export const syncMeta = sqliteTable("sync_meta", {
  id: integer("id").primaryKey(),
  lastSyncAt: text("last_sync_at"),
  totalPages: integer("total_pages").default(0),
});

export type CmsPage = typeof cmsPages.$inferSelect;
export type NewCmsPage = typeof cmsPages.$inferInsert;
