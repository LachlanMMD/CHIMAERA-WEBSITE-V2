/**
 * /data/events.json — generated at build time from src/content/events/.
 * Same shape the homepage scripts (public/js/next-event.js, events.js)
 * always read, so they work unchanged.
 */
import type { APIRoute } from "astro";
import { getEvents, statusOf, urlOf } from "../../lib/events";

export const GET: APIRoute = async () => {
  const events = await getEvents();

  const data = events.map((event) => {
    const status = statusOf(event);

    return {
      slug: event.id,
      title: event.data.title,
      date: event.data.date,
      venue: event.data.venue,
      poster: event.data.poster ?? null,
      ticketUrl: event.data.stripeUrl ?? "#",
      status,
      soldOut: event.data.soldOut,
      url: urlOf(event),
    };
  });

  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
