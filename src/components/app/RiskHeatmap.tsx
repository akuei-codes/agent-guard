import { useMemo } from "react";

/**
 * 7×24 risk heatmap — last 7 days × hours of day.
 * Deterministic-ish pseudo data so the visual is calm between renders.
 */
export function RiskHeatmap({ seed = 7 }: { seed?: number }) {
  const cells = useMemo(() => {
    const out: number[][] = [];
    for (let d = 0; d < 7; d++) {
      const row: number[] = [];
      for (let h = 0; h < 24; h++) {
        // Higher pressure during business hours, light overnight burst
        const base =
          (Math.sin((h / 24) * Math.PI * 2 + d * 0.7) + 1) * 0.5 * 0.7 +
          (h >= 9 && h <= 18 ? 0.25 : 0) +
          ((seed * (d + 1) * (h + 1)) % 13) / 60;
        row.push(Math.min(1, base));
      }
      out.push(row);
    }
    return out;
  }, [seed]);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="rounded-2xl border border-border/60 bg-surface/40 backdrop-blur-sm p-5">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-ice">
            Risk heatmap
          </div>
          <h3 className="text-sm font-semibold mt-1">Intercept density · 7d × 24h</h3>
        </div>
        <Legend />
      </div>

      <div className="flex gap-2">
        <div className="flex flex-col justify-between py-[1px] text-[9px] font-mono text-muted-foreground">
          {days.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="flex-1 grid grid-rows-7 gap-[3px]">
          {cells.map((row, d) => (
            <div key={d} className="grid grid-cols-24 gap-[3px]" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
              {row.map((v, h) => (
                <div
                  key={h}
                  title={`${days[d]} ${String(h).padStart(2, "0")}:00 · ${(v * 100).toFixed(0)}%`}
                  className="aspect-square rounded-[2px] transition-colors"
                  style={{ background: heatColor(v) }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-24 text-[9px] font-mono text-muted-foreground/60 pl-[26px]" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
        {Array.from({ length: 24 }).map((_, h) => (
          <span key={h} className="text-center">
            {h % 6 === 0 ? String(h).padStart(2, "0") : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function heatColor(v: number): string {
  // 0 → near-transparent ice; 0.5 → signal-tinted; 1 → block red
  if (v < 0.33) {
    const a = 0.05 + v * 0.4;
    return `color-mix(in oklab, var(--ice) ${(a * 100).toFixed(0)}%, transparent)`;
  }
  if (v < 0.7) {
    const a = (v - 0.33) / 0.37;
    return `color-mix(in oklab, var(--signal) ${(20 + a * 40).toFixed(0)}%, color-mix(in oklab, var(--ice) 15%, transparent))`;
  }
  const a = (v - 0.7) / 0.3;
  return `color-mix(in oklab, var(--block) ${(40 + a * 50).toFixed(0)}%, transparent)`;
}

function Legend() {
  return (
    <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground">
      <span>low</span>
      <div className="flex gap-[2px]">
        {[0.05, 0.25, 0.45, 0.65, 0.85, 1].map((v) => (
          <div key={v} className="h-2 w-3 rounded-sm" style={{ background: heatColor(v) }} />
        ))}
      </div>
      <span>high</span>
    </div>
  );
}
