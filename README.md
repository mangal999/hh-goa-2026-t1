# HH Goa 2026 Frame / ID Card Generator

A web tool for **Hacker House Goa 2026** (Task #1 — "HH Goa Frame / ID Card Generator" from hhgoa.com): upload a photo, get an instantly branded graphic, download it, and share to X with `#FrameInGoa`.

## Features

- **Two formats** (A/B toggle on one page):
  - **PFP Frame** — 1600×1600 square frame around the photo for an X profile picture.
  - **Builder ID** — 1080×1350 portrait event badge with photo + name + stack/role + auto-generated "builder title" (synced to stack keywords, rerollable).
- **Upload**: JPG, PNG, WebP, and **HEIC from iPhone** (converted in-browser via `heic2any`, lazy-loaded).
- **No manual cropping**: smart center cover-crop handles portrait, landscape, off-center, and any aspect ratio. Optional drag/zoom crop adjust state is wired in (`CropState`).
- **Near-instant**: all image processing runs client-side on an HTML `<canvas>`. Debounced live preview + high-res PNG export (`toBlob`/`toDataURL`).
- **Download**: real PNG file.
- **Share to X**:
  - Mobile: native Web Share API attaches the image with a pre-filled caption.
  - Desktop: image is hosted via `/api/store` (Vercel Blob) and a pre-filled tweet opens whose link preview shows the graphic via `/share/[id]` with `og:image` + `twitter:card=summary_large_image`.
- **On-brand**: real assets pulled from hhgoa.com (`public/assets/`) — deep green `#0B6839` + yellow `#FEE101` palette, Imbue + Victor Mono (Google Fonts), palm glyph + "Hacker House" wordmark, sunrise motif.
- **Mobile-friendly** single-pass UI. No login, no signup.

## Tech stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Deployed on Vercel (recommended) with Vercel Blob for share-hosted images
- Client-side Canvas rendering (`lib/render.ts`) + `heic2any` for HEIC

## Project structure

```
app/
  layout.tsx            # fonts, viewport, metadata (metadataBase from env)
  page.tsx              # renders <FrameGenerator/>
  fonts.ts              # Google fonts (Imbue + Victor Mono) as CSS vars --hh-imbue/--hh-mono
  globals.css           # Tailwind v4 theme tokens
  api/store/route.ts    # POST image blob -> Vercel Blob, returns { id, url }
  share/[id]/page.tsx   # OG/share page; og:image & twitter card point at the hosted graphic
components/
  FrameGenerator.tsx    # main client component: state, preview render, download, share
  UploadDropzone.tsx    # drag/drop + click upload (jpg/png/heic/webp)
  FormatToggle.tsx      # PFP / Builder ID switch
  ControlsPanel.tsx     # name + stack + builder title inputs + reroll (Format B only)
lib/
  theme.ts              # brand colors, asset paths, output dimensions, event copy
  render.ts             # canvas renderers: drawPfp / drawId, cover-crop maths
  photo.ts              # HEIC detection/conversion, image decode helpers
  builderTitles.ts      # keyword-driven builder title generator
  share.ts              # Web Share, tweet intent URL, caption helpers, isMobile()
public/
  assets/   # official HH Goa assets downloaded from hhgoa.com (wordmark, palm, sunrise, trees)
  samples/  # sample.jpg / sample.png / sample.heic for quick testing
```

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. Upload any photo (the "try jpg / png / heic" buttons load sample files), toggle the format, then Download or Share.

## Environment variables

| Variable                 | Required | Purpose                                                           |
| ------------------------ | -------- | ----------------------------------------------------------------- |
| `NEXT_PUBLIC_BASE_URL`   | prod     | Canonical origin for `metadataBase`/OG images.                    |
| `BLOB_READ_WRITE_TOKEN`  | prod     | Vercel Blob token so `/api/store` can host shared images.         |

Without a blob token, download + mobile share still work; desktop share degrades to a text-only tweet intent.

## Deploy

```bash
vercel
```

Create Vercel Blob storage and set `BLOB_READ_WRITE_TOKEN`; set `NEXT_PUBLIC_BASE_URL` to the production domain.

## Verification

- `npm run build` and `npm run lint` pass clean.
- End-to-end checked headlessly: upload→render→toggle→export for all three sample formats; share-page emits `og:image`/`twitter:card`.
- Note: exported PNGs should get a human visual pass — palette/branding are verified programmatically.

## Docs to know

This repo pins Next.js 16, which has breaking changes (Promised `params`/`searchParams`, `ImageResponse` from `next/og`, GET handlers uncached by default, no `next lint` — use the ESLint CLI). Full guides live in `node_modules/next/dist/docs/` (see `AGENTS.md`).