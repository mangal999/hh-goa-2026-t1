import type { Metadata } from "next";
import Link from "next/link";
import { list } from "@vercel/blob";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function resolveFrameUrl(id: string): Promise<string | undefined> {
  try {
    const { blobs } = await list({ prefix: `frames/${id}` });
    const match = blobs.find((b) => b.pathname.startsWith(`frames/${id}.`));
    return match?.url;
  } catch {
    return undefined;
  }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = await params;
  const sp = await searchParams;
  const legacyImg = typeof sp.img === "string" ? sp.img : undefined;
  const img = (await resolveFrameUrl(id)) ?? legacyImg;
  const meta = {
    title: `HH Goa 2026 · ${id.slice(0, 8)}`,
    description: "My HH Goa 2026 frame 🌴 #FrameInGoa",
  };
  if (!img) return { ...meta, openGraph: meta, twitter: { card: "summary" } };
  const imageMeta = {
    url: img,
    secureUrl: img,
    type: "image/jpeg",
    alt: "My HH Goa 2026 frame — check it out",
  };
  return {
    ...meta,
    openGraph: {
      ...meta,
      siteName: "HH Goa 2026",
      url: "https://hhgoa.com",
      type: "website",
      images: [imageMeta],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [imageMeta],
    },
  };
}

export default async function SharePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const legacyImg = typeof sp.img === "string" ? sp.img : undefined;
  const img = (await resolveFrameUrl(id)) ?? legacyImg;

  if (!img) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0B6839] p-8 font-mono text-white">
        <h1 className="font-imbue text-6xl font-bold uppercase">HH Goa 2026</h1>
        <p className="text-sm uppercase tracking-widest text-white/70">
          Missing shared image · frame {id.slice(0, 8)}
        </p>
        <Link href="/" className="mt-4 rounded-full bg-[#FEE101] px-6 py-3 text-sm font-bold uppercase text-[#0B6839]">
          Make your own
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0B6839] p-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img}
        alt="Your HH Goa 2026 frame"
        className="w-full max-w-md rounded-2xl border-2 border-white/15 shadow-2xl"
      />
      <div className="flex items-center gap-3 font-mono text-sm uppercase tracking-widest text-white">
        <span>#FrameInGoa</span>
        <span className="text-white/40">·</span>
        <span>Hacker House Goa 2026</span>
      </div>
      <Link
        href="/"
        className="rounded-full bg-[#FEE101] px-6 py-3 font-mono text-sm font-bold uppercase tracking-widest text-[#0B6839] transition-transform hover:scale-105"
      >
        Make your own →
      </Link>
    </main>
  );
}
