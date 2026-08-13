"use client";

import { useEffect } from "react";
import { BRAND } from "@/lib/theme";
import type { UserInput } from "@/lib/render";

interface ControlsPanelProps {
  format: "pfp" | "id";
  input: UserInput;
  onChange: (input: UserInput) => void;
  disabled?: boolean;
}

export default function ControlsPanel({ format, input, onChange, disabled }: ControlsPanelProps) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("builder-roll"));
  }, []);

  if (format === "pfp") return null;

  const set = (patch: Partial<UserInput>) => onChange({ ...input, ...patch });

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-white/15 bg-white/5 p-4">
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] font-bold tracking-widest text-white/60">YOUR NAME</span>
        <input
          type="text"
          value={input.name}
          maxLength={24}
          disabled={disabled}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="e.g. Aarav"
          className="rounded-lg border-2 border-white/20 bg-black/30 px-4 py-2.5 font-mono text-base text-white placeholder-white/30 outline-none transition-colors focus:border-[#FEE101] disabled:opacity-50"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] font-bold tracking-widest text-white/60">STACK / ROLE</span>
        <input
          type="text"
          value={input.stack}
          maxLength={32}
          disabled={disabled}
          onChange={(e) => set({ stack: e.target.value })}
          placeholder="e.g. Solidity · Frontend"
          className="rounded-lg border-2 border-white/20 bg-black/30 px-4 py-2.5 font-mono text-base text-white placeholder-white/30 outline-none transition-colors focus:border-[#FEE101] disabled:opacity-50"
        />
      </label>

      <div className="flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="font-mono text-[11px] font-bold tracking-widest text-white/60">
            BUILDER TITLE{" "}
            <span className="text-white/40">(auto)</span>
          </span>
          <input
            type="text"
            value={input.builderTitle}
            maxLength={32}
            disabled={disabled}
            onChange={(e) => set({ builderTitle: e.target.value })}
            className="rounded-lg border-2 border-white/20 bg-black/30 px-4 py-2.5 font-mono text-base text-white outline-none transition-colors focus:border-[#FEE101] disabled:opacity-50"
          />
        </label>
        <button
          type="button"
          disabled={disabled}
          onClick={() => window.dispatchEvent(new CustomEvent("builder-roll"))}
          aria-label="Reroll builder title"
          className="rounded-lg border-2 border-[#FEE101] bg-[#FEE101] px-4 py-2.5 font-mono text-sm font-bold text-[#0B6839] transition-transform hover:scale-105 disabled:opacity-50"
          style={{ backgroundColor: BRAND.yellow, color: BRAND.green }}
        >
          ↻ ROLL
        </button>
      </div>
    </div>
  );
}