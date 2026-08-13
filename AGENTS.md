<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project: HH Goa 2026 Frame / ID Card Generator

Read `README.md` before changing anything. Key context for updates:

- **App**: one-page Next.js 16 (App Router + TS + Tailwind v4) tool. Upload a photo → branded graphic → download / share to X with `#FrameInGoa`.
- **Canvas rendering**: `lib/render.ts` draws both formats (PFP 1600², ID 1080×1350) client-side. Change design/layout here.
  - Use the downloaded brand assets in `public/assets/` (wordmark PNG, palm glyph SVG `goa_hindi.svg`). All assets are referenced by path in `lib/theme.ts` — swap out by replacing files there.
  - Brand colors in `lib/theme.ts` `BRAND`: green `#0B6839`, yellow `#FEE101`. Fonts are Imbue + Victor Mono via `next/font` (CSS vars `--hh-imbue`/`--hh-mono`), read in `FrameGenerator.tsx` for canvas via `getComputedStyle` (NOT via `next/font`'s `style` — see the SSR `window` guard).
- **Text inputs / builder title**: `components/ControlsPanel.tsx` + `lib/builderTitles.ts` (keyword-driven generator, dispatched via `builder-roll` CustomEvent). Labels/`maxLength`s and the copy live here.
- **Share flow**: `lib/share.ts` (Web Share for mobile, tweet intent for desktop) + `app/api/store/route.ts` (Vercel Blob → `{id,url}`) + `app/share/[id]/page.tsx` (OG/twitter meta). Update captions/hashtags in `lib/share.ts`.
- **Env**: `BLOB_READ_WRITE_TOKEN` (Vercel Blob, prod) and `NEXT_PUBLIC_BASE_URL` (metadataBase). Missing blob token degrades desktop share gracefully.
- **Samples for testing**: `public/samples/sample.{jpg,png,heic}` — HEIC is processed in-browser by `heic2any` (`lib/photo.ts`).
- **Re-generating a real HEIC sample**: `pip install --break-system-packages pillow-heif`, then `python3` with `register_heif_opener()`; `ImageMagick`/HTML `convert` does NOT produce a true HEIC here.
- **Common edit points**: button copy & tweaks in `components/FrameGenerator.tsx`; styling in Tailwind classes + `app/globals.css` theme tokens; canvas composition in `lib/render.ts`.
- **Verify**: `npm run build` and `npm run lint` (no `next lint` in v16). Visual export check: render a PNG then inspect pixels programmatically — this model cannot preview images.
