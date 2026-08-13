import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://hhgoa-frame.vercel.app"),
  title: "HH Goa 2026 Frame Generator",
  description:
    "Upload a photo, get an instantly branded HH Goa 2026 PFP frame or Builder ID card. Download and share to X with #FrameInGoa.",
  openGraph: {
    title: "HH Goa 2026 Frame Generator",
    description: "Instantly branded HH Goa 2026 PFP frame & Builder ID. #FrameInGoa",
    url: "https://hhgoa.com",
    siteName: "HH Goa 2026",
    type: "website",
    images: [{ url: "/assets/goa_hindi.svg", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary",
    title: "HH Goa 2026 Frame Generator",
    description: "Get branded with #FrameInGoa",
    images: ["/assets/goa_hindi.svg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0B6839",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0B6839] text-white">
        {children}
      </body>
    </html>
  );
}