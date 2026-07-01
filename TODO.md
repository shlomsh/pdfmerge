# TODO — remaining work

This is the pick-up list for future agents. Background and invariants live in
[CLAUDE.md](./CLAUDE.md); this file is just the remaining work, in priority order.
SEO strategy/reference material lives in [seo-audit-output/](./seo-audit-output/)
(see `SEARCH-POSITIONING-STRATEGY.md`, `FULL-AUDIT-REPORT.md`, `ACTION-PLAN.md`).

The site is a suite of **100% client-side** PDF tools. The hard constraint on
every task below: **no file bytes ever leave the device** — no `fetch`/`XHR` of
PDF contents, no third-party API. All processing runs in the browser via
`@cantoo/pdf-lib` and `pdfjs-dist`. `PdfMergeTool.jsx` + `src/lib/merge.js` are
the reference implementation for how a finished tool should look (progress
callback, reset-on-mutation, focus-the-download-button-on-done, blob download).

## Definition of done (every tool)

A tool is only "done" when all of these ship together — half-finishing one
leaves a noindexed page or a tool that 404s its own logic:

1. **Logic** — add the real `src/lib/<tool>.js`, pure functions, no network.
2. **Wire-up** — replace the `setTimeout` mock in the `Pdf<Tool>Tool.jsx`
   component with the real call; show progress, produce a downloadable `Blob`,
   reset state to `idle` (and revoke the object URL) on any file mutation.
   Mirror `PdfMergeTool.jsx`.
3. **On-page content + schema** — add a visible "How it works" + FAQ section to
   the `.astro` page, and a matching `<SeoSchema name=… description=… faq=… />`
   (FAQ schema only — HowTo schema was removed; Google deprecated HowTo rich
   results in 2023). Structured data MUST mirror the visible text. See
   `merge.astro` for the pattern.
4. **De-noindex** — remove the `noindex` prop from the page's `<BaseLayout>`.
5. **Sitemap** — add the route to `public/sitemap.xml`.
6. **Verify** — `npm run build && npm run preview` (NOT just `npm run dev` — the
   CSP that can break island hydration is build/preview-only). Click the tool in
   the preview and confirm it actually processes + downloads.
7. **Test** — add a component test alongside the others (see
   `PdfMergeTool.dnd.test.jsx`, `PdfSignTool.test.jsx`).

## Tool status

**All Phase 1 tools are implemented and promoted** (de-noindexed, in the sitemap,
with visible "How it works" + FAQ and a matching `<SeoSchema>`): Merge, Sign,
Split, Edit (remove/rotate/page-numbers), PDF-to-Image, Compress, Unlock,
Protect, Image-to-PDF. Redact/Whiteout also shipped. Only `404.astro` remains
`noindex` (correct).

---

## Remaining work

From the 2026-07 technical audit
([seo-audit-output/TECHNICAL-AUDIT-2026-07.md](./seo-audit-output/TECHNICAL-AUDIT-2026-07.md)):

- [x] **`/protect/` killed as redundant.** `PdfSecurityTool` auto-detects
      (encrypted → unlock, unencrypted → protect), so `/unlock` already covered
      protection. Deleted `protect.astro`, removed from sitemap + `404.astro`,
      added a 301 `/protect → /unlock` in `vercel.json`. Follow-up: fold the
      "protect pdf / add pdf password" keywords into `unlock.astro`'s copy so the
      redirect target actually ranks for them.
- [x] **`/redact` added to `public/sitemap.xml`** (it was indexable + linked but
      undeclared).
- [x] **`font-src` tightened to `'self'`** in `astro.config.mjs` — fonts are
      self-hosted, the `fonts.gstatic.com` token was dead. Needs a
      `npm run build && npm run preview` pass to confirm no CSP font regression.
- [ ] **Add HSTS header** to `vercel.json`
      (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`)
      — only once the final domain is confirmed HTTPS-only.
- [ ] **Homepage FAQ schema** — `index.astro` shows a visible FAQ but passes no
      `faq=` to `<SeoSchema>`; wire the visible FAQ into the schema for rich-result
      eligibility (mirror the tool pages).
- [ ] **Add `browserRequirements`** to `SeoSchema.astro`'s `softwareApp` object
      (`"Requires JavaScript. Requires HTML5 Canvas or WebAssembly..."`).
- [ ] **IndexNow** (low priority) — drop a `public/<key>.txt` and ping on deploy
      for faster Bing/Yandex indexing.
- [ ] **Pre-launch: real domain.** `astro.config.mjs`'s `site` and the sitemap/
      canonical URLs currently use the `pdkef.vercel.app` placeholder — update to
      the real custom domain before launch, and re-verify canonical/OG tags.
- [ ] **Register Google Search Console** and submit the sitemap once the domain is
      final; monitor Core Web Vitals (prioritize INP for signature-drawing).
- [ ] When considering the homepage hub, confirm no tool cards point at any
      noindexed route (currently only 404 is noindex, so this is likely already
      clean — re-check if any tool is ever un-promoted).

## Content authority (post-launch, from the search-positioning strategy)

- [ ] Dedicated long-tail landing pages: `/sign-pdf-no-signup`,
      `/offline-pdf-form-filler`, `/open-source-pdf-editor`.
- [ ] OS-specific how-to guides (e.g. "Fill Out PDF Forms on Mac Without Adobe
      Acrobat"), internally linking into the interactive tools — no outbound promo
      links.
- [ ] Public GitHub repo + iframe embed model for contextual backlinks.
