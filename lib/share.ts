export const CAPTION = "My HH Goa 2026 badge 🌴 Built with the HH Goa Frame Generator. #FrameInGoa #HackerHouseGoa #247Builders";

export function buildCaption(builderTitle?: string, name?: string): string {
  const parts: string[] = [];
  if (name) parts.push(name);
  if (builderTitle) parts.push(`— ${builderTitle}`);
  parts.push("#FrameInGoa #HackerHouseGoa");
  return parts.join(" ");
}

export function tweetIntentUrl(caption: string, url?: string): string {
  const text = url ? `${caption}\n${url}` : caption;
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
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
