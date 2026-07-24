// Timezone- and ICU-independent date formatting.
//
// `Date.prototype.toLocaleDateString("en-IN", …)` formats in the runtime's local timezone
// using the runtime's ICU data. On the server (Node, UTC) and the client (browser, e.g.
// IST) that can produce DIFFERENT text for the same instant — a timestamp near midnight UTC
// renders as one day on the server and the next day in IST — which trips React hydration
// text mismatches (#418/#425). Using UTC getters + fixed month names makes a given ISO date
// render byte-identically everywhere, so it is safe in components that hydrate on the client.

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * Format a date as "24 Jul 2026" (short) or "24 July 2026" (long), deterministically.
 * Returns "" for null/undefined/empty/invalid input.
 */
export function formatDate(
  input: string | number | Date | null | undefined,
  style: "short" | "long" = "short",
): string {
  if (input === null || input === undefined || input === "") return "";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  const months = style === "long" ? MONTHS_LONG : MONTHS_SHORT;
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
