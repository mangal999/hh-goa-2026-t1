"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import UploadDropzone from "@/components/UploadDropzone";
import FormatToggle from "@/components/FormatToggle";
import ControlsPanel from "@/components/ControlsPanel";
import { BRAND, EVENTS, RENDER_VERSION } from "@/lib/theme";
import { convertHeicToJpeg, decodeImage, isHeic } from "@/lib/photo";
import type { CropState, Format, RenderOptions, UserInput } from "@/lib/render";
import { generateBuilderTitle } from "@/lib/builderTitles";
import { buildCaption, shareImageWithCaption, tweetIntentUrl } from "@/lib/share";

interface StoredImage {
  id: string;
  url: string;
}

async function urlToFile(src: string, fileName: string, type: string): Promise<File> {
  const res = await fetch(src);
  const blob = await res.blob();
  return new File([blob], fileName, { type });
}

export default function FrameGenerator() {
  const [format, setFormat] = useState<Format>("id");
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [stored, setStored] = useState<StoredImage | null>(null);
  const [crop, setCrop] = useState<CropState>({ panX: 0, panY: 0, zoom: 1 });
  const [input, setInput] = useState<UserInput>({ name: "", stack: "", builderTitle: "" });

  const previewRef = useRef<HTMLCanvasElement>(null);
  const renderCache = useRef<{ key: string; url: string } | null>(null);

  const handleFile = useCallback(async (f: File) => {
    setBusy(true);
    setError(null);
    setStored(null);
    try {
      let usable = f;
      if (isHeic(f)) usable = await convertHeicToJpeg(f);
      const decoded = await decodeImage(usable);
      setFile(usable);
      setImg(decoded);
      setCrop({ panX: 0, panY: 0, zoom: 1 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that photo. Try a JPG, PNG or HEIC.");
      setImg(null);
      setFile(null);
    } finally {
      setBusy(false);
    }
  }, []);

  const rerollTitle = useCallback(() => {
    setInput((prev) => ({ ...prev, builderTitle: generateBuilderTitle(prev.stack) }));
  }, []);

  useEffect(() => {
    window.addEventListener("builder-roll", rerollTitle);
    return () => window.removeEventListener("builder-roll", rerollTitle);
  }, [rerollTitle]);

  const inputKey = useMemo(
    () =>
      JSON.stringify({
        format,
        input,
        crop,
        version: RENDER_VERSION,
        hasImg: !!img,
        imgW: img?.naturalWidth,
        imgH: img?.naturalHeight,
      }),
    [format, input, crop, img]
  );

  const fonts = useCallback((): RenderOptions["fonts"] => {
    if (typeof window === "undefined") {
      return { imbue: "'Imbue', serif", mono: "'Victor Mono', monospace" };
    }
    const cs = window.getComputedStyle(document.documentElement);
    return {
      imbue: cs.getPropertyValue("--hh-imbue").trim() || "Imbue, serif",
      mono: cs.getPropertyValue("--hh-mono").trim() || "monospace",
    };
  }, []);

  const renderCanvas = useCallback(
    async (fmt: Format): Promise<HTMLCanvasElement | null> => {
      const { renderToCanvas } = await import("@/lib/render");
      return renderToCanvas(fmt, { img, input, crop, fonts: fonts() });
    },
    [img, input, crop, fonts]
  );

  const canvasToBlob = useCallback(
    (canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> =>
      new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality)),
    []
  );

  const renderToDataUrl = useCallback(
    async (fmt: Format): Promise<string | null> => {
      const canvas = await renderCanvas(fmt);
      return canvas ? canvas.toDataURL("image/png") : null;
    },
    [renderCanvas]
  );

  // Debounced preview render
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    if (renderCache.current?.key === inputKey) return;
    let cancelled = false;
    const id = window.setTimeout(async () => {
      const url = await renderToDataUrl(format);
      if (!cancelled && url) {
        renderCache.current = { key: inputKey, url };
        const el = new Image();
        el.onload = () => {
          if (cancelled) return;
          canvas.width = el.naturalWidth;
          canvas.height = el.naturalHeight;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(el, 0, 0);
        };
        el.src = url;
      }
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [inputKey, format, renderToDataUrl]);

  const generateBlob = useCallback(async (): Promise<Blob | null> => {
    const url =
      renderCache.current?.key === inputKey ? renderCache.current.url : await renderToDataUrl(format);
    if (!url) return null;
    const res = await fetch(url);
    return res.blob();
  }, [inputKey, format, renderToDataUrl]);

  const download = useCallback(async () => {
    const blob = await generateBlob();
    if (!blob) return;
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = format === "pfp" ? "hh-goa-pfp.png" : "hh-goa-builder-id.png";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, [generateBlob, format]);

  const store = useCallback(
    async (blob: Blob, name: string): Promise<StoredImage> => {
      const data = new FormData();
      data.append("image", blob, name);
      const res = await fetch("/api/store", { method: "POST", body: data });
      if (!res.ok) throw new Error("Could not host image for sharing");
      return res.json();
    },
    []
  );

  const share = useCallback(async () => {
    const canvas = await renderCanvas(format);
    if (!canvas) return;
    setSharing(true);
    try {
      const name = format === "pfp" ? "hh-goa-pfp" : "hh-goa-builder-id";
      const caption = buildCaption(input.name || undefined);
      const pngBlob = await canvasToBlob(canvas, "image/png");
      if (!pngBlob) throw new Error("Could not render image");
      const fileResult = await shareImageWithCaption(pngBlob, `${name}.png`, caption);
      if (fileResult.handled) return;

      let shareUrl: string | undefined;
      try {
        const jpgBlob = await canvasToBlob(canvas, "image/jpeg", 0.9);
        if (!jpgBlob) throw new Error("Could not compress image");
        const img = stored ?? (await store(jpgBlob, `${name}.jpg`));
        if (!stored) setStored(img);
        shareUrl = `${window.location.origin}/share/${img.id}?img=${encodeURIComponent(img.url)}`;
      } catch {
        shareUrl = undefined;
      }
      window.open(tweetIntentUrl(caption, shareUrl), "_blank", "noopener,noreferrer");
      setSharing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Share failed. Try downloading instead.");
      setSharing(false);
    }
  }, [renderCanvas, canvasToBlob, format, input, stored, store]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🌴</span>
          <div>
            <h1 className="font-imbue text-3xl font-bold uppercase leading-none tracking-tight">
              HH Goa <span style={{ color: BRAND.yellow }}>2026</span>
            </h1>
<p className="font-mono text-[11px] font-semibold tracking-[0.3em] text-white/60">
                Less Noise.
                <br className="sm:hidden" />
                More Signal
              </p>
          </div>
        </div>
        <a
          href="https://hhgoa.com"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border-2 border-[#FEE101] px-4 py-2 font-mono text-xs font-bold tracking-widest text-[#FEE101] transition-colors hover:bg-[#FEE101] hover:text-[#0B6839]"
        >
          OCT 28–31
        </a>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 pb-12">
        {!img && (
          <section className="mx-auto flex w-full max-w-xl flex-col gap-4 pt-8">
            <UploadDropzone onFile={handleFile} disabled={busy} />
            {busy && (
              <p className="text-center font-mono text-xs tracking-widest text-white/60">
                {file && isHeic(file) ? "CONVERTING HEIC…" : "LOADING…"}
              </p>
            )}
            {error && (
              <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-center font-mono text-xs text-red-300">
                {error}
              </p>
            )}
            <div className="mx-auto mt-4 flex max-w-md flex-col items-center gap-2 text-center">
              <p className="font-mono text-[11px] tracking-[0.25em] text-white/50">SAMPLE PHOTOS</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    urlToFile("/samples/sample.jpg", "sample.jpg", "image/jpeg").then(handleFile)
                  }
                  className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 font-mono text-xs text-white/70 hover:border-[#FEE101] hover:text-white"
                >
                  try jpg
                </button>
                <button
                  type="button"
                  onClick={() =>
                    urlToFile("/samples/sample.png", "sample.png", "image/png").then(handleFile)
                  }
                  className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 font-mono text-xs text-white/70 hover:border-[#FEE101] hover:text-white"
                >
                  try png
                </button>
                <button
                  type="button"
                  onClick={() =>
                    urlToFile("/samples/sample.heic", "sample.heic", "image/heic").then(handleFile)
                  }
                  className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 font-mono text-xs text-white/70 hover:border-[#FEE101] hover:text-white"
                >
                  try heic
                </button>
              </div>
            </div>
          </section>
        )}

        {img && (
          <section className="flex flex-col gap-6 lg:flex-row">
            <div className="flex flex-1 flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <FormatToggle format={format} onChange={setFormat} />
                <button
                  type="button"
                  onClick={() => {
                    setImg(null);
                    setFile(null);
                    setStored(null);
                  }}
                  className="rounded-full border border-white/20 px-4 py-2 font-mono text-xs font-bold tracking-widest text-white/70 transition-colors hover:border-[#FEE101] hover:text-white"
                >
                  ✕ NEW PHOTO
                </button>
              </div>
              <div className="relative mx-auto w-full max-w-2xl">
                <canvas
                  ref={previewRef}
                  className="w-full rounded-2xl border-2 border-white/10 shadow-2xl"
                  style={{ aspectRatio: format === "pfp" ? "1 / 1" : "4 / 5", backgroundColor: BRAND.green }}
                />
                {format === "pfp" && (
                  <div className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#FEE101] px-3 py-1 font-mono text-[10px] font-bold tracking-widest text-[#0B6839]">
                    PFP · 1:1
                  </div>
                )}
              </div>
              <ControlsPanel format={format} input={input} onChange={setInput} />
            </div>

            <aside className="flex flex-col gap-4 lg:w-80">
              {error && (
                <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 font-mono text-xs text-red-300">
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-3 rounded-2xl border-2 border-white/15 bg-white/5 p-4">
                <button
                  type="button"
                  onClick={download}
                  disabled={!img}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#FEE101] px-4 py-3.5 font-mono text-sm font-bold tracking-widest text-[#0B6839] transition-transform hover:scale-[1.02] disabled:opacity-50"
                >
                  ⬇ DOWNLOAD PNG
                </button>
                <button
                  type="button"
                  onClick={share}
                  disabled={!img || sharing}
                  className="flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3.5 font-mono text-sm font-bold tracking-widest text-white transition-transform hover:scale-[1.02] disabled:opacity-50"
                >
                  {sharing ? "SHARING…" : "𝕏 SHARE TO X"}
                </button>
              </div>

              <div className="rounded-2xl border-2 border-[#FEE101]/20 bg-[#FEE101]/5 p-4">
                <p className="font-mono text-[11px] font-bold tracking-widest text-[#FEE101]">
                  SHIP IT, BUILDER
                </p>
                <p className="mt-2 font-mono text-xs leading-relaxed text-white/70">
                  In Goa the code compiles faster, the sun sets slower, and this frame gets more
                  eyes than your PR review. Lock in — we&apos;ll see you at 2:47 PM.
                </p>
              </div>
            </aside>
          </section>
        )}
      </main>

      <footer className="border-t border-white/10 py-6 text-center font-mono text-[11px] tracking-widest text-white/40">
        {EVENTS.tag} · HACKER HOUSE GOA · 28–31 OCT 2026 · BUILT FOR THE RESIDENCY
      </footer>
    </div>
  );
}