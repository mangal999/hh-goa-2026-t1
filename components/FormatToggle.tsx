"use client";

import { BRAND } from "@/lib/theme";
import type { Format } from "@/lib/render";

interface FormatToggleProps {
  format: Format;
  onChange: (f: Format) => void;
  disabled?: boolean;
}

const OPTIONS: Array<{ value: Format; label: string; hint: string }> = [
  { value: "pfp", label: "PFP FRAME", hint: "square · X profile pic" },
  { value: "id", label: "BUILDER ID", hint: "portrait · event badge" },
];

export default function FormatToggle({ format, onChange, disabled }: FormatToggleProps) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border-2 border-white/15 p-2">
      {OPTIONS.map((opt) => {
        const active = format === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`rounded-xl px-4 py-3 text-center transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              active
                ? "bg-[#FEE101] text-[#0B6839] shadow-lg"
                : "bg-white/5 text-white hover:bg-white/10"
            }`}
            style={active ? { backgroundColor: BRAND.yellow, color: BRAND.green } : undefined}
          >
            <span className="block font-mono text-sm font-bold tracking-widest">{opt.label}</span>
            <span
              className={`mt-0.5 block font-mono text-[11px] tracking-wide ${
                active ? "text-[#0B6839]/70" : "text-white/50"
              }`}
            >
              {opt.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}
