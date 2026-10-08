/**
 * Event helpers shared by the event pages and the generated events.json.
 * "Past" is decided at build time from the date (Copenhagen time), so the
 * site needs a rebuild after each event — the nightly GitHub Action does it.
 */
import { getCollection, type CollectionEntry } from "astro:content";

export type EventEntry = CollectionEntry<"events">;
export type EventStatus = "upcoming" | "soldout" | "past";

/** Today as YYYY-MM-DD in Copenhagen. */
export function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Copenhagen" }).format(new Date());
}

/** All events; drafts only during `npm run dev`. */
export async function getEvents(): Promise<EventEntry[]> {
  const all = await getCollection("events", ({ data }) => import.meta.env.DEV || !data.draft);
  return all.sort((a, b) => a.data.date.localeCompare(b.data.date));
}

export function statusOf(event: EventEntry): EventStatus {
  if (event.data.date < today()) return "past";
  return event.data.soldOut ? "soldout" : "upcoming";
}

/** Upcoming events have their own page; past ones live in the archive. */
export function urlOf(event: EventEntry): string {
  return statusOf(event) === "past" ? `/archive/#${event.id}` : `/events/${event.id}/`;
}

/** 2026-11-14 → 14.11.2026 */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}
