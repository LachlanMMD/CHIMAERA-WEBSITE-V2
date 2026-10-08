// @ts-check
import { defineConfig } from "astro/config";

// Static site: every page is built to plain HTML in dist/.
// Pages are served as folders (/about/ → about/index.html), matching the old URLs.
export default defineConfig({
  site: "https://www.chimaera.cph",
  build: {
    format: "directory",
  },
  // The floating dev toolbar sits on top of the design; off by default.
  devToolbar: {
    enabled: false,
  },
});
