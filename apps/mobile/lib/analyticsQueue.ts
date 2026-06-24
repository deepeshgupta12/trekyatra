/**
 * SQLite-backed offline event queue.
 * Events that fail to post (offline) are stored here and flushed on reconnect / foreground.
 * Uses the same expo-sqlite sync API as db/client.ts.
 */
import * as SQLite from "expo-sqlite";

const queueDb = SQLite.openDatabaseSync("ty_analytics_queue.db");

queueDb.execSync(`
  CREATE TABLE IF NOT EXISTS event_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payload TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  )
`);

export type QueuedEvent = Record<string, unknown>;

export function enqueueEventSync(payload: QueuedEvent): void {
  try {
    queueDb.runSync(
      "INSERT INTO event_queue (payload) VALUES (?)",
      JSON.stringify(payload)
    );
  } catch {
    // Non-critical — drop silently to avoid crashing the caller
  }
}

export function flushQueueSync(
  postFn: (events: QueuedEvent[]) => Promise<void>
): void {
  try {
    const rows = queueDb.getAllSync<{ id: number; payload: string }>(
      "SELECT id, payload FROM event_queue ORDER BY id LIMIT 50"
    );
    if (rows.length === 0) return;

    const events = rows.map((r) => JSON.parse(r.payload) as QueuedEvent);
    const ids = rows.map((r) => r.id);

    postFn(events)
      .then(() => {
        const placeholders = ids.map(() => "?").join(",");
        queueDb.runSync(
          `DELETE FROM event_queue WHERE id IN (${placeholders})`,
          ...ids
        );
      })
      .catch(() => {
        // Still offline — leave rows in queue
      });
  } catch {
    // Non-critical
  }
}

export function clearQueueSync(): void {
  try {
    queueDb.runSync("DELETE FROM event_queue");
  } catch {
    // Non-critical
  }
}
