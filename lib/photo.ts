let heic2anyPromise: Promise<typeof import("heic2any")> | null = null;

async function loadHeic2Any() {
  if (!heic2anyPromise) {
    heic2anyPromise = import("heic2any");
  }
  return heic2anyPromise;
}

export function isHeic(file: File): boolean {
  return /\.heic$/i.test(file.name) || file.type === "image/heic" || file.type === "image/heif";
}

export async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await loadHeic2Any()).default;
  const blob = (await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.9,
  })) as Blob | Blob[];

  const out = Array.isArray(blob) ? blob[0] : blob;
  const baseName = file.name.replace(/\.heic$/i, "");
  return new File([out], `${baseName}.jpg`, { type: "image/jpeg" });
}

export interface PhotoMeta {
  width: number;
  height: number;
  orientation: number;
}

export function decodeImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode image"));
    };
    img.src = url;
  });
}

export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = url;
  });
}
