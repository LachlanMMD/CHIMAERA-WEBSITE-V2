/**
 * /sitemap.xml — generated at build time. Static pages plus every
 * published event page (drafts are excluded by getEvents in builds).
 * No dependency: a plain endpoint, like data/events.json.ts.
 */
import type { APIRoute } from "astro";
import { getEvents, urlOf } from "../lib/events";

const STATIC_PATHS = ["/", "/events/", "/archive/", "/about/", "/contact/", "/privacy/", "/terms/"];

export const GET: APIRoute = async ({ site }) => {
  const events = await getEvents();
  const paths = [...STATIC_PATHS, ...events.map(urlOf)];

  const urls = paths
    .map((path) => `  <url><loc>${new URL(path, site).href}</loc></url>`)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
