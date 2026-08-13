"use client";

import { useCallback, useRef, useState } from "react";
import { BRAND } from "@/lib/theme";

interface UploadDropzoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export default function UploadDropzone({ onFile, disabled }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload a photo"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`relative flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-all ${
        dragOver
          ? "border-[#FEE101] bg-[#FEE101]/10"
          : "border-white/25 bg-white/5 hover:border-[#FEE101]/70 hover:bg-white/10"
      } disabled:cursor-not-allowed disabled:opacity-50`}
      style={dragOver ? { borderColor: BRAND.yellow, backgroundColor: "rgba(254,225,1,0.1)" } : undefined}
    >
      <div className="text-5xl">🌴</div>
      <div className="font-mono text-lg font-bold tracking-widest text-white">
        DROP YOUR PHOTO
      </div>
      <div className="max-w-xs font-mono text-xs leading-relaxed text-white/60">
        JPG · PNG · HEIC from iPhone — no cropping needed, we&apos;ll fit it for you
      </div>
      <div className="mt-1 rounded-full bg-[#FEE101] px-6 py-2.5 font-mono text-sm font-bold tracking-widest text-[#0B6839] transition-transform hover:scale-105">
        CHOOSE FILE
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}