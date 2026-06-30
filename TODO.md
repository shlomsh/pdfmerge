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
   the `.astro` page, and a matching `<SeoSchema name=… description=… faq=… />`
   (FAQ schema only — HowTo schema was removed; Google deprecated HowTo rich
   results in 2023). Structured data MUST mirror the visible text (Google
   penalises mismatches). See `merge.astro` for the pattern.
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
- [x] If it works: add a `<SeoSchema>` + visible HowTo/FAQ to `sign.astro`,
      remove its `noindex`, add `/sign` to `sitemap.xml`. (`sign.astro` keyword:
      "Sign PDF Online Free".)
- [ ] The `PdfSignTool.test.jsx` only covers initial render + load transition —
      extend it to assert the export path produces a blob.

## 2. Split PDF — `/split`, `PdfSplitTool.jsx` — done

Keyword: "Split PDF Online Free - Extract Pages from PDF". `src/lib/split.js`
implements range parsing and page extraction. Promoted: de-noindexed, in the
sitemap, has HowTo/FAQ + `<SeoSchema>`, and a component test
(`PdfSplitTool.test.jsx`).

## 3. Remove Pages — `/remove-pages`, `PdfRemovePagesTool.jsx` — done

Keyword: "Remove Pages from PDF Online Free". `src/lib/removePages.js`
removes selected page indices via a thumbnail grid (reuses
`src/lib/thumbnails.js`). Promoted: de-noindexed, in the sitemap, has
HowTo/FAQ + `<SeoSchema>`, and a component test
(`PdfRemovePagesTool.test.jsx`).

## 4. PDF to Image — `/pdf-to-image`, `PdfToImageTool.jsx` — done

`src/lib/toImage.js` renders each page with `pdfjs-dist` to a canvas, then
`canvas.toBlob()` as PNG or JPG at a chosen scale (Standard/High/Maximum).
Multiple pages download sequentially (no zip dependency, per the
MIT/Apache + zero-network constraint). Promoted: de-noindexed, in the
sitemap, has HowTo/FAQ + `<SeoSchema>`, and a component test
(`PdfToImageTool.test.jsx`). Verified with `npm run build && npm run preview`.

## 5. Compress PDF — `/compress`, `PdfCompressTool.jsx` — done

Keyword: "Compress PDF Online Free - Reduce PDF File Size". `src/lib/compress.js`
rasterises pages via `pdfjs-dist` and re-encodes at one of three quality
presets (Extreme/Recommended/High Quality), since pdf-lib alone doesn't
recompress embedded image streams. Trade-off is disclosed on-page: output
loses text selection/copy and embedded links. Promoted: de-noindexed, in the
sitemap, has HowTo/FAQ + `<SeoSchema>`, and a component test
(`PdfCompressTool.test.jsx`).

## 6. Unlock PDF — `/unlock`, `PdfUnlockTool.jsx` — done

Keyword: "Unlock PDF Online Free - Remove PDF Password". New tool, not in the
original Phase 1 scope — added per SEO research recommending it as a
high client-side fit, lower-competition target (privacy angle: users are
reluctant to upload a password-protected file to a server to remove its
password). `src/lib/unlock.js` uses `@cantoo/pdf-lib`'s native
`PDFDocument.load(bytes, { password })` to decrypt — no new dependency.
Promoted: de-noindexed, in the sitemap, has HowTo/FAQ + `<SeoSchema>`, a
homepage tool card, and a component test (`PdfUnlockTool.test.jsx`).
Verified with `npm run build && npm run preview` against a real encrypted
PDF (both correct- and incorrect-password paths).

---

## Cross-cutting (after the tools, or alongside)

- [x] PWA app icons (`public/icons/*.png`) and `og-image` are done — icons
      depict a document + privacy-lock badge on the real brand blue
      (`--color-primary: #0071e3`), generated via `sharp` from an inline SVG.
- [ ] **`og:site_name` / visible header wordmark** — brand "PDkef" is in the
      title/h1/schema but there's no site-wide header logo or `og:site_name`.
- [ ] When all tools are promoted, revisit whether the homepage hub still needs
      any tool cards pointing at noindexed routes.
