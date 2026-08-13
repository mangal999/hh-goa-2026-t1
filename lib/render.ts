import { BRAND, DIMENSIONS, EVENTS } from "./theme";

export type Format = "pfp" | "id";

export interface UserInput {
  name: string;
  stack: string;
  builderTitle: string;
}

export interface CropState {
  panX: number;
  panY: number;
  zoom: number;
}

export interface RenderOptions {
  img: HTMLImageElement | null;
  input: UserInput;
  crop: CropState;
  fonts: { imbue: string; mono: string };
}

const PALM_IMG = "/assets/goa_hindi.svg";
const WORDMARK_IMG = "/assets/Hacker_house.png";

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function coverSource(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  panX = 0,
  panY = 0,
  zoom = 1
) {
  const scale = Math.max(dstW / srcW, dstH / srcH) * zoom;
  const sw = dstW / scale;
  const sh = dstH / scale;
  const maxOffX = Math.max(0, (srcW - sw) / 2);
  const maxOffY = Math.max(0, (srcH - sh) / 2);
  let sx = (srcW - sw) / 2 + panX * maxOffX * 2;
  let sy = (srcH - sh) / 2 + panY * maxOffY * 2;
  sx = Math.max(0, Math.min(srcW - sw, sx));
  sy = Math.max(0, Math.min(srcH - sh, sy));
  return { sx, sy, sw, sh };
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  crop: CropState
) {
  ctx.save();
  roundedRect(ctx, x, y, w, h, r);
  ctx.clip();
  const { sx, sy, sw, sh } = coverSource(
    img.naturalWidth,
    img.naturalHeight,
    w,
    h,
    crop.panX,
    crop.panY,
    crop.zoom
  );
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  font: (size: number) => string,
  start = 64
) {
  let size = start;
  ctx.font = font(size);
  while (ctx.measureText(text).width > maxWidth && size > 24) {
    size -= 2;
    ctx.font = font(size);
  }
  return size;
}

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

async function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load ${src}`));
    img.src = src;
  });
}

async function ensureFontsLoaded(fonts: { imbue: string; mono: string }) {
  const pending: Promise<unknown>[] = [];
  const families = [fonts.imbue, fonts.mono].map((f) => f.replace(/^"|"$/g, ""));
  for (const size of [400, 700]) {
    for (const family of families) {
      pending.push(
        (document as Document & { fonts?: { load: (f: string) => Promise<unknown> } }).fonts?.load(
          `${size} 100px "${family}"`
        ) ?? Promise.resolve()
      );
    }
  }
  try {
    await Promise.all(pending);
  } catch {
    /* fonts may not load on slow networks; fallback to system fonts */
  }
}

function textOnArc(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  midAngle: number,
  font: string,
  color: string,
  bottom = false
) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const chars = Array.from(text);
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0);
  const dir = bottom ? -1 : 1;
  let a = midAngle - (dir * total) / (2 * radius);
  for (let i = 0; i < chars.length; i++) {
    ctx.save();
    ctx.translate(cx + radius * Math.cos(a), cy + radius * Math.sin(a));
    ctx.rotate(a + (dir * Math.PI) / 2);
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();
    a += (dir * widths[i]) / radius;
  }
  ctx.restore();
}

function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  lineWidth: number
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.stroke();
}

function drawPixelated(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  size: number,
  alpha: number
) {
  const t = document.createElement("canvas");
  t.width = 36;
  t.height = 36;
  const tc = t.getContext("2d")!;
  tc.drawImage(img, 0, 0, 36, 36);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(t, x, y, size, size);
  ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = true;
  ctx.restore();
}

export async function renderToCanvas(
  format: Format,
  opts: RenderOptions
): Promise<HTMLCanvasElement> {
  const { width, height } = DIMENSIONS[format];
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  await ensureFontsLoaded(opts.fonts);

  const palm = await loadImg(PALM_IMG).catch(() => null);
  const wordmark = await loadImg(WORDMARK_IMG).catch(() => null);

  if (format === "pfp") {
    drawPfp(ctx, width, height, opts);
  } else {
    drawId(ctx, width, height, opts, palm, wordmark);
  }
  return canvas;
}

function drawPfp(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  opts: RenderOptions
) {
  const { fonts } = opts;
  const imbue = (size: number) => `${size}px ${fonts.imbue}`;
  const mono = (size: number) => `${size}px ${fonts.mono}`;

  const cx = W / 2;
  const cy = H / 2;
  const R = 590;

  ctx.fillStyle = BRAND.green;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, W * 0.8);
  glow.addColorStop(0, "rgba(254, 225, 1, 0.28)");
  glow.addColorStop(1, "rgba(254, 225, 1, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();
  const d = R * 2;
  if (opts.img) {
    const { sx, sy, sw, sh } = coverSource(
      opts.img.naturalWidth,
      opts.img.naturalHeight,
      d,
      d,
      opts.crop.panX,
      opts.crop.panY,
      opts.crop.zoom
    );
    ctx.drawImage(opts.img, sx, sy, sw, sh, cx - R, cy - R, d, d);
  } else {
    ctx.fillStyle = BRAND.green;
    ctx.fillRect(cx - R, cy - R, d, d);
  }
  ctx.restore();

  ctx.strokeStyle = "rgba(254, 225, 1, 0.28)";
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 18]);
  ctx.beginPath();
  ctx.arc(cx, cy, R - 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = "rgba(254, 225, 1, 0.18)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, R + 16, 0, Math.PI * 2);
  ctx.stroke();

  ctx.shadowColor = BRAND.yellow;
  ctx.shadowBlur = 42;
  ctx.strokeStyle = BRAND.yellow;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  const ringOuter = 748;
  ctx.strokeStyle = "rgba(254, 225, 1, 0.4)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, ringOuter, 0, Math.PI * 2);
  ctx.stroke();

  textOnArc(ctx, "> SHIPPING REAL PRODUCTS", cx, cy, 664, Math.PI * 1.5, mono(55), BRAND.yellow);
  textOnArc(ctx, "HH GOA '26", cx, cy, 672, Math.PI / 2, imbue(96), BRAND.yellow, true);
  textOnArc(ctx, "GOA · INDIA", cx, cy, 674, Math.PI, mono(40), BRAND.yellow);
  textOnArc(ctx, "28-31 OCT 2026", cx, cy, 674, 0, mono(40), BRAND.yellow);

  drawCrosshair(ctx, 62, cy, 20, BRAND.yellow, 4);
  drawCrosshair(ctx, W - 62, cy, 20, BRAND.yellow, 4);
}

function drawId(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  opts: RenderOptions,
  palm: HTMLImageElement | null,
  wordmark: HTMLImageElement | null
) {
  const { fonts, input } = opts;
  const imbue = (size: number) => `${size}px ${fonts.imbue}`;
  const mono = (size: number) => `${size}px ${fonts.mono}`;

  const SPLIT = Math.round(H * 0.6);

  ctx.fillStyle = BRAND.green;
  ctx.fillRect(0, 0, W, SPLIT);
  ctx.fillStyle = BRAND.greenDark;
  ctx.fillRect(0, SPLIT, W, H - SPLIT);

  if (palm) {
    drawPixelated(ctx, palm, W - 320, SPLIT - 330, 300, 0.07);
    drawPixelated(ctx, palm, -190, SPLIT + 40, 420, 0.05);
  }

  if (wordmark) {
    const ww = 210;
    const wh = (wordmark.naturalHeight / wordmark.naturalWidth) * ww;
    ctx.drawImage(wordmark, 50, 40, ww, wh);
  } else {
    ctx.fillStyle = BRAND.white;
    ctx.font = imbue(46);
    ctx.textAlign = "left";
    ctx.fillText("HACKER HOUSE", 50, 84);
  }

  ctx.textAlign = "right";
  ctx.fillStyle = BRAND.yellow;
  ctx.font = mono(30);
  ctx.fillText("> RESIDENCY PASS", W - 50, 84);

  ctx.strokeStyle = "rgba(254, 225, 1, 0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 148);
  ctx.lineTo(W - 50, 148);
  ctx.stroke();

  const cardX = 150;
  const cardW = W - 300;
  const cardY = 166;
  const cardH = 564;

  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  roundedRect(ctx, cardX + 18, cardY + 26, cardW, cardH, 14);
  ctx.fill();

  ctx.fillStyle = BRAND.white;
  roundedRect(ctx, cardX, cardY, cardW, cardH, 14);
  ctx.fill();

  const pad = 24;
  const phx = cardX + pad;
  const phy = cardY + pad;
  const phw = cardW - 2 * pad;
  const phh = cardH - 3 * pad;

  if (opts.img) {
    drawCover(ctx, opts.img, phx, phy, phw, phh, 8, opts.crop);
  } else {
    ctx.fillStyle = BRAND.greenDark;
    ctx.fillRect(phx, phy, phw, phh);
  }

  ctx.fillStyle = BRAND.green;
  ctx.font = mono(26);
  ctx.textAlign = "center";
  ctx.fillText("OFFICIAL BUILDER", cardX + cardW / 2, cardY + cardH - 12);

  ctx.save();
  ctx.translate(cardX + 46, cardY - 2);
  ctx.rotate(-0.16);
  ctx.fillStyle = "rgba(254, 225, 1, 0.8)";
  ctx.fillRect(-36, -12, 72, 24);
  ctx.restore();
  ctx.save();
  ctx.translate(cardX + cardW - 46, cardY - 2);
  ctx.rotate(0.16);
  ctx.fillStyle = "rgba(254, 225, 1, 0.8)";
  ctx.fillRect(-36, -12, 72, 24);
  ctx.restore();

  const name = (input.name || "HACKER").toUpperCase();
  ctx.textAlign = "center";
  const nameSize = fitText(ctx, name, W - 90, (s) => imbue(s), 250);
  ctx.font = imbue(nameSize);
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillText(name, W / 2 + 6, 900 + 8);
  ctx.fillStyle = BRAND.white;
  ctx.fillText(name, W / 2, 900);

  const stack = (input.stack || "FULL-STACK").toUpperCase();
  ctx.textAlign = "left";
  ctx.fillStyle = BRAND.yellow;
  ctx.font = mono(46);
  ctx.fillText(`> STACK: ${stack}`, 64, 978);

  const title = (input.builderTitle || "CLOUD SHIP MACHINE").toUpperCase();
  const label = "> BUILDER: ";
  const line = `${label}${title}`;
  const boxY = 1028;
  const boxH = 112;
  const boxX = 64;
  const tsize = fitText(ctx, line, W - 200, (s) => mono(s), 52);
  ctx.font = mono(tsize);
  const labelW = ctx.measureText(label).width;
  const totalW = ctx.measureText(line).width;
  ctx.strokeStyle = BRAND.yellow;
  ctx.lineWidth = 3;
  roundedRect(ctx, boxX, boxY, totalW + 80, boxH, 14);
  ctx.stroke();
  const baseline = boxY + boxH / 2 + tsize * 0.36;
  ctx.fillStyle = BRAND.yellow;
  ctx.fillText(label, boxX + 40, baseline);
  ctx.fillStyle = BRAND.white;
  ctx.fillText(title, boxX + 40 + labelW, baseline);

  ctx.font = mono(28);
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.fillText(`> ${EVENTS.tag} · TRACK: SHIPPING · SEQ: 2:47 PM`, 64, 1212);

  const rand = makeRng(20261028);
  const by = H - 96;
  const bx = 64;
  const bw = W - 128;
  const bh = 68;

  ctx.fillStyle = BRAND.white;
  roundedRect(ctx, bx, by, bw, bh, 8);
  ctx.fill();

  ctx.fillStyle = BRAND.ink;
  const barTop = by + 10;
  const barH = bh - 22;
  let x = bx + 16;
  for (let i = 0; i < 22; i++) {
    const w = 2 + Math.floor(rand() * 6);
    ctx.fillRect(x, barTop, w, barH);
    x += w + 2;
    if (x > bx + 350) break;
  }

  ctx.fillStyle = BRAND.ink;
  ctx.font = mono(30);
  ctx.textAlign = "left";
  ctx.fillText("HH GOA '26 · SHIP IT", bx + 400, by + 42);

  const qx = bx + 884;
  const qs = 48;
  const p = qs / 8;
  const grid = makeRng(4242);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (grid() < 0.45) ctx.fillRect(qx + c * p, by + 12 + r * p, p - 1, p - 1);
    }
  }
  ctx.fillRect(qx, by + 12, 2 * p, 2 * p);
  ctx.fillRect(qx + 6 * p, by + 12 + 6 * p, 2 * p, 2 * p);

  ctx.strokeStyle = BRAND.greenDark;
  ctx.lineWidth = 10;
  roundedRect(ctx, 12, 12, W - 24, H - 24, 44);
  ctx.stroke();

  ctx.strokeStyle = "rgba(254, 225, 1, 0.5)";
  ctx.lineWidth = 2;
  roundedRect(ctx, 26, 26, W - 52, H - 52, 36);
  ctx.stroke();
}