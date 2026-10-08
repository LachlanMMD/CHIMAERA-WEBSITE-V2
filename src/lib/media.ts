/**
 * Archive media, discovered from folders — no lists to maintain.
 *
 *   src/assets/events/<event-slug>/
 *     01.jpg 02.jpg …          photos (jpg/jpeg/png/webp), shown in file-name order
 *     05.mp4                   short muted clip (mp4/webm), slots in by file name
 *     05.poster.jpg            optional still for that clip (same name + .poster.jpg)
 *
 * Photos are resized and converted at build time by Astro, so drop in
 * full-size exports; nothing heavy ships to phones.
 */
import type { ImageMetadata } from "astro";

const images = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/events/*/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}",
  { eager: true },
);

const videos = import.meta.glob<string>("/src/assets/events/*/*.{mp4,webm,MP4,WEBM}", {
  eager: true,
  query: "?url",
  import: "default",
});

export type MediaItem =
  | { kind: "photo"; name: string; image: ImageMetadata }
  | { kind: "video"; name: string; src: string; poster?: ImageMetadata };

/** "/src/assets/events/<slug>/<file>" → { slug, file } */
function parts(path: string) {
  const segments = path.split("/");
  return { slug: segments[segments.length - 2], file: segments[segments.length - 1] };
}

/** All photos and clips for one event, in file-name order. */
export function mediaFor(slug: string): MediaItem[] {
  const posters = new Map<string, ImageMetadata>();
  const items: MediaItem[] = [];

  for (const [path, mod] of Object.entries(images)) {
    const { slug: s, file } = parts(path);
    if (s !== slug) continue;

    if (/\.poster\.(jpe?g|png|webp)$/i.test(file)) {
      posters.set(file.replace(/\.poster\.(jpe?g|png|webp)$/i, ""), mod.default);
    } else {
      items.push({ kind: "photo", name: file, image: mod.default });
    }
  }

  for (const [path, src] of Object.entries(videos)) {
    const { slug: s, file } = parts(path);
    if (s !== slug) continue;

    const base = file.replace(/\.(mp4|webm)$/i, "");
    items.push({ kind: "video", name: file, src, poster: posters.get(base) });
  }

  return items.sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
}
