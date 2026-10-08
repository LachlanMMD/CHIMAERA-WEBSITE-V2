/**
 * Events collection: one markdown file per event in src/content/events/.
 * The file name is the URL slug: ink-night-2026-11.md → /events/ink-night-2026-11/
 * Fields match docs/HOMEPAGE-SPEC.md §11. A missing required field fails the
 * build with the file and field named, so a broken event never ships.
 */
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const events = defineCollection({
  loader: glob({ base: "./src/content/events", pattern: "**/[^_]*.md" }),
  schema: z.object({
    /** true = only visible in `npm run dev`, never built for the live site. */
    draft: z.boolean().default(false),

    title: z.string(),
    medium: z.string().optional(),

    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
    time: z.string().regex(/^\d{2}:\d{2}$/, "time must be HH:MM").optional(),

    venue: z.string(),
    area: z.string().optional(),

    price: z.number().optional(),
    stripeUrl: z.string().url().optional(),
    soldOut: z.boolean().default(false),

    /** Path inside public/, e.g. "/assets/images/events/ink-night/poster.jpg". */
    poster: z.string().startsWith("/").optional(),

    duration: z.string().optional(),
    bring: z.string().optional(),
    experience: z.string().optional(),

    /** After the event: photo paths inside public/. */
    photos: z.array(z.string().startsWith("/")).default([]),
  }),
});

export const collections = { events };
