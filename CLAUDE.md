# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A 100% client-side, no-backend static web app that merges PDF files in the browser, optimized to rank for the SEO keyword "pdf merge online free." There is no server component and never should be — files must never leave the user's device. This is the central product constraint; do not introduce any upload/API call that sends file contents off-device.

## Commands

```bash
npm install
npm run dev       # local dev server
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

Deploy: push to `main` → Vercel auto-deploys (GitHub integration), custom domain attached in Vercel dashboard.

## Architecture

- `src/merge.js` — pdf-lib glue: `mergePdfs(files, order) -> Blob`. The only place PDF bytes are read/concatenated.
- `src/sort.js` — sort helpers. Name sort is natural/numeric-aware (`file2` < `file10`). Date sort uses `File.lastModified` — **the browser File API cannot read OS file creation date**, only modification time, so this is the ceiling of what's possible without a backend. A secondary "PDF created date" sort can use pdf-lib's `PDFDocument.getCreationDate()` (internal PDF metadata) as a fallback when present.
- `src/ui.js` — file list rendering, SortableJS wiring (drag reorder always overrides the last applied sort), progress/download flow.
- `src/thumbnails.js` — lazy-loaded PDF.js page-1 thumbnail rendering; must not block initial load (dynamic import).
- `index.html` — the SEO surface. Content (H1, how-to steps, FAQ) must remain as **static HTML present in the initial payload**, not injected via JS after load, so crawlers index it without executing scripts. JSON-LD (`WebApplication`/`SoftwareApplication`, `FAQPage`, `HowTo`) lives in `<head>` and must stay valid — check with Google's Rich Results Test after edits.

## SEO invariants (don't regress these)

- Primary keyword ("pdf merge online free" / "merge pdf online free") stays in `<title>`, the single `<h1>`, and meta description.
- Only one `<h1>` per page.
- `robots.txt` and `sitemap.xml` in `public/` must stay reachable and accurate.
- Canonical URL tag, Open Graph + Twitter Card tags must stay present.
- Target Lighthouse SEO + Performance ≥ 95 — keep bundles small (no heavy frameworks), lazy-load thumbnails, avoid layout shift.

## PWA

`vite-plugin-pwa` (Workbox) precaches the app shell + libraries so repeat visits are cache-served and the app works fully offline after first load. Manifest + icons live in `public/`.
