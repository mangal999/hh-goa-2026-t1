export const CAPTION = "My HH Goa 2026 badge 🌴 Built with the HH Goa Frame Generator. #FrameInGoa #HackerHouseGoa #247Builders";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://hhgoa-frame.vercel.app";

export function buildCaption(name?: string): string {
  const parts: string[] = [];
  if (name) parts.push(`${name} —`);
  parts.push(
    "Just locked in my HH Goa '26 pass 🪪🌴 Terminal in the tropics — peep my frame, then build and ship yours 👇"
  );
  parts.push(BASE_URL + "\n\n");
  parts.push("#FrameInGoa #HackerHouseGoa \n#HHGoa26 @247pmstudio");
  return parts.join("\n");
}

export function tweetIntentUrl(caption: string, url?: string): string {
  const params = new URLSearchParams({ text: caption });
  if (url) params.set("url", url);
  return `https://x.com/intent/tweet?${params.toString()}`;
}

export interface ShareFileResult {
  handled: boolean;
}

export async function shareImageWithCaption(
  blob: Blob,
  fileName: string,
  caption: string
): Promise<ShareFileResult> {
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean; share?: (data: ShareData) => Promise<void> };

  if (typeof navigator.share !== "function") {
    return { handled: false };
  }

  const file = new File([blob], fileName, { type: blob.type });
  const shareData: ShareData = { text: caption, files: [file] };

  if (nav.canShare && !nav.canShare(shareData)) {
    return { handled: false };
  }

  try {
    await navigator.share(shareData);
    return { handled: true };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { handled: true };
    }
    return { handled: false };
  }
}

export function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 0 && window.innerWidth < 768);
}
