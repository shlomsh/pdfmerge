# Technical SEO Audit - PDkef (2026-07-01)

Static Astro site, `output: 'static'`, no SSR/backend. All SEO surface is
build-time HTML (crawler-friendly); PDF tools are Preact islands (`client:load`).
Scope: crawlability, indexability, structured data, CWV/INP, security, and the
browser-local/offline positioning.

## Technical Score: 84/100

| Category | Status | Score |
|----------|--------|-------|
| Crawlability | warn | 80/100 |
| Indexability | warn | 78/100 |
| Security | warn | 80/100 |
| URL Structure | pass | 95/100 |
| Mobile | pass | 95/100 |
| Core Web Vitals | pass (by design) | 88/100 |
| Structured Data | pass | 90/100 |
| JS Rendering | pass | 95/100 |
| IndexNow | fail (absent) | 40/100 |

**What's already strong:** all marketing/FAQ content is server-rendered HTML (no
JS-rendering risk - Google sees everything without executing scripts); one `<h1>`
per page; self-referencing canonicals; OG/Twitter cards; valid `SoftwareApplication`
+ `FAQPage` JSON-LD emitted in initial HTML (not JS-injected - matches Google's
Dec-2025 guidance); strict hash-based CSP; clean hyphenated URLs; the
`/remove-pages → /edit-pdf` 301 is correct. Fonts are self-hosted, so page load
makes **zero external requests** - the offline/privacy claim is genuinely true,
which is a real ranking + GEO asset most competitors can't make.

---

## Critical Issues
_None._ No indexing blockers, no HTTPS/mixed-content problems, no JS-rendering
traps.

## High Priority (within 1 week)

1. **`/protect/` is effectively orphaned.** It's a fully-built, indexed page in
   the sitemap, but the homepage tool hub (`index.astro`) does **not** link to it
   - its only internal link is from `404.astro`. Orphaned pages get little
   PageRank flow and slow discovery. **Fix:** add a "Protect PDF" card to the
   homepage `tools` array.

2. **`/redact/` is indexable but missing from the sitemap.** Inverse of the
   above: linked from the homepage and has no `noindex`, but absent from
   `public/sitemap.xml`. **Fix:** add `/redact/` to the sitemap (or add `noindex`
   to `redact.astro` if it's intentionally unlisted - pick one).

3. **CSP allows `fonts.gstatic.com` but nothing uses it.** All 7 fonts are
   self-hosted from `/fonts/*.ttf` (`global.css` `@font-face`). The
   `font-src 'self' https://fonts.gstatic.com` line in `astro.config.mjs` is dead
   and weakens the "no external origins, ever" story. **Fix:** drop the
   `https://fonts.gstatic.com` token → `font-src 'self'`. (Build+preview after -
   CSP is build/preview-only.)

## Medium Priority (within 1 month)

4. **No HSTS header.** `vercel.json` sets `X-Content-Type-Options`,
   `X-Frame-Options`, `Referrer-Policy`, and `frame-ancestors`, but not
   `Strict-Transport-Security`. For a privacy-positioned tool, HSTS is expected.
   **Fix:** add `"Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload"`
   to the `vercel.json` headers (only after you're certain the final domain is
   HTTPS-only - preload is hard to reverse).

5. **`site` is still the `pdkef.vercel.app` placeholder.** Feeds canonical,
   sitemap, OG URLs, and JSON-LD `url`. Update `astro.config.mjs` `site` +
   `sitemap.xml` + `robots.txt` to the real domain before launch, or all those
   signals point at the wrong host.

6. **Homepage lacks page-level `FAQPage` schema despite having a visible FAQ.**
   `index.astro` renders an FAQ section (line ~175) but only emits
   `SoftwareApplication` (no `faq=` passed to `<SeoSchema>`). Passing the visible
   FAQ into the schema makes the homepage eligible for FAQ rich results too.

## Low Priority (backlog)

7. **IndexNow not implemented.** A static `public/<key>.txt` + a ping on deploy
   would speed Bing/Yandex indexing. Low effort, non-Google upside.

8. **AI-crawler stance is implicit.** `robots.txt` is `Allow: /` for all - fine,
   and probably correct here: being cited by ChatGPT/Perplexity/AI Overviews for
   "private/offline/no-signup PDF" queries is pure upside for this positioning.
   No change needed, but worth a deliberate note (see `seo-geo` skill for an
   llms.txt / citability pass - a strong fit for the privacy angle).

---

## Positioning opportunities (from our stance)

- **The offline/zero-upload claim is verifiably true and rare.** Lean into it as a
  structured signal, not just marketing copy: the PWA + self-hosted fonts + strict
  `connect-src 'self'` mean a reviewer/crawler can confirm no bytes leave the
  device. This is the moat the search-positioning strategy identifies (low-KD
  "offline/local/no-signup" queries). Tightening `font-src` (#3) reinforces it.
- **`browserRequirements` on the schema** (per the strategy doc's recommended
  JSON-LD) isn't currently set - adding `"browserRequirements": "Requires
  JavaScript..."` to `SeoSchema.astro`'s `softwareApp` object better describes the
  client-side nature to crawlers.
- **Long-tail landing pages** (`/sign-pdf-no-signup`, `/offline-pdf-form-filler`,
  `/open-source-pdf-editor`) remain the biggest untapped low-difficulty capture -
  tracked in TODO.md's content-authority section.
