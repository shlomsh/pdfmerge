# TODO — unimplemented functionality

This is the pick-up list for future agents. Background and invariants live in
[CLAUDE.md](./CLAUDE.md); this file is just the remaining work, in priority order.

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
   the `.astro` page, and a matching `<SeoSchema name=… description=… howTo=…
   faq=… />`. Structured data MUST mirror the visible text (Google penalises
   mismatches). See `merge.astro` for the pattern.
4. **De-noindex** — remove the `noindex` prop from the page's `<BaseLayout>`.
5. **Sitemap** — add the route to `public/sitemap.xml`.
6. **Verify** — `npm run build && npm run preview` (NOT just `npm run dev` — the
   CSP that can break island hydration is build/preview-only). Click the tool in
   the preview and confirm it actually processes + downloads.
7. **Test** — add a component test alongside the others (see
   `PdfMergeTool.dnd.test.jsx`, `PdfSignTool.test.jsx`).

---

## 1. Verify & promote Sign (smallest task — it's already built)

`PdfSignTool.jsx` (~1140 lines) is **fully implemented** — it renders pages with
`pdfjs-dist`, places text/signature/checkmark elements, and exports via
`pdfDoc.save()` with a real download URL. It is the odd one out: functional but
still `noindex`'d and absent from the sitemap.

- [ ] Manually verify in `build && preview`: open a PDF, add a signature/text,
      download, and confirm the output PDF actually contains the markup.
- [ ] If it works: add a `<SeoSchema>` + visible HowTo/FAQ to `sign.astro`,
      remove its `noindex`, add `/sign` to `sitemap.xml`. (`sign.astro` keyword:
      "Sign PDF Online Free".)
- [ ] The `PdfSignTool.test.jsx` only covers initial render + load transition —
      extend it to assert the export path produces a blob.

## 2. Split PDF — `/split`, `PdfSplitTool.jsx` (mock)

Keyword: "Split PDF Online Free - Extract Pages from PDF".

- [ ] `src/lib/split.js`: load with pdf-lib, let the user pick page ranges
      (e.g. `1-3, 5, 8-`), produce either one PDF of the kept pages or N PDFs.
      If multiple output files, bundle them — consider a tiny dependency-free zip
      (or just download sequentially) to avoid a network/library surprise; keep
      the MIT/Apache + zero-network constraint.
- [ ] Page-selection UI in the component (reuse `src/lib/thumbnails.js` for
      page previews).
- [ ] Replace the `setTimeout` mock; follow the DoD above.

## 3. Remove Pages — `/remove-pages`, `PdfRemovePagesTool.jsx` (mock)

Keyword: "Remove Pages from PDF Online Free".

- [ ] `src/lib/removePages.js`: load, `removePage()` the selected indices, save.
- [ ] Thumbnail grid with per-page select/deselect (reuse `thumbnails.js`).
- [ ] Replace the mock; follow the DoD. (Closely related to Split — they can
      share a page-thumbnail selection component.)

## 4. PDF to Image — `/pdf-to-image`, `PdfToImageTool.jsx` (mock)

Keyword: "Convert PDF to Image Online Free - PDF to JPG/PNG".

- [ ] `src/lib/toImage.js`: render each page with `pdfjs-dist` to a canvas, then
      `canvas.toBlob()` as PNG or JPG at a chosen DPI/quality. Multiple pages →
      bundle/zip or download each.
- [ ] UI: format toggle (PNG/JPG), quality/scale, per-page or all.
- [ ] Replace the mock; follow the DoD. Note the worker-URL pattern in
      `thumbnails.js` (Vite `new URL(...)`) — reuse it, never a CDN worker.

## 5. Compress PDF — `/compress`, `PdfCompressTool.jsx` (mock) — hardest

Keyword: "Compress PDF Online Free - Reduce PDF File Size".

- [ ] `src/lib/compress.js`. **Caveat:** pdf-lib does NOT recompress embedded
      image streams, so a naive `load()`+`save()` barely shrinks anything. Real
      gains need rasterising/downsampling images: render pages or extract images
      via `pdfjs-dist`, re-encode to lower-quality JPG on a canvas, rebuild the
      PDF. Decide the approach (and its quality tradeoff) before building UI, and
      verify it still meets the zero-network constraint. This is the most
      research-heavy tool — scope it before committing to copy that promises
      lossless compression.
- [ ] Replace the mock; follow the DoD.

---

## Cross-cutting (after the tools, or alongside)

- [ ] **Launch blockers from CLAUDE.md** still open: generate real PNG app icons
      in `public/icons/` (only `favicon.svg` exists today) and an `/og-image.png`
      referenced by `BaseLayout.astro`.
- [ ] **`og:site_name` / visible header wordmark** — brand "PDkef" is in the
      title/h1/schema but there's no site-wide header logo or `og:site_name`.
- [ ] When all tools are promoted, revisit whether the homepage hub still needs
      any tool cards pointing at noindexed routes.
