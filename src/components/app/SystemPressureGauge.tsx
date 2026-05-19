import { useEffect, useState } from "react";

/**
 * Animated arc gauge driven by an externally-provided pressure value (0–100).
 * Smoothly interpolates toward the target.
 */
export function SystemPressureGauge({ target }: { target: number }) {
  const [value, setValue] = useState(target);

  useEffect(() => {
    let raf: number;
    const step = () => {
      setValue((v) => {
        const delta = target - v;
        if (Math.abs(delta) < 0.2) return target;
        return v + delta * 0.08;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const pct = Math.max(0, Math.min(100, value));
  const angle = -120 + (pct / 100) * 240; // -120° → +120°
  const tone = pct > 75 ? "var(--block)" : pct > 45 ? "var(--warn)" : "var(--signal)";

  return (
    <div className="relative rounded-2xl border border-border/60 bg-surface/40 backdrop-blur-sm p-5 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background: `radial-gradient(circle at 50% 80%, color-mix(in oklab, ${tone} 25%, transparent), transparent 60%)`,
        }}
      />
      <div className="relative">
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-ice">
          System pressure
        </div>
        <h3 className="text-sm font-semibold mt-1">Real-time load</h3>

        <div className="mt-5 flex items-end justify-center">
          <svg viewBox="0 0 200 130" className="w-full max-w-[260px]">
            <defs>
              <linearGradient id="gauge-arc" x1="0" x2="1">
                <stop offset="0%" stopColor="var(--signal)" />
                <stop offset="55%" stopColor="var(--warn)" />
                <stop offset="100%" stopColor="var(--block)" />
              </linearGradient>
            </defs>
            {/* Track */}
            <path
              d="M20 110 A 80 80 0 0 1 180 110"
              fill="none"
              stroke="color-mix(in oklab, var(--foreground) 8%, transparent)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Active arc */}
            <path
              d="M20 110 A 80 80 0 0 1 180 110"
              fill="none"
              stroke="url(#gauge-arc)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray="251.2"
              strokeDashoffset={251.2 - (pct / 100) * 251.2}
              style={{ transition: "stroke-dashoffset 200ms linear" }}
            />
            {/* Needle */}
            <g transform={`translate(100 110) rotate(${angle})`}>
              <line x1="0" y1="0" x2="0" y2="-72" stroke={tone} strokeWidth="2.5" strokeLinecap="round" />
              <circle r="6" fill={tone} />
              <circle r="2" fill="var(--background)" />
            </g>
          </svg>
        </div>

        <div className="mt-2 text-center">
          <div className="font-mono text-3xl tabular-nums" style={{ color: tone }}>
            {pct.toFixed(0)}
            <span className="text-base text-muted-foreground">%</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-0.5">
            {pct > 75 ? "Elevated" : pct > 45 ? "Nominal" : "Calm"}
          </div>
        </div>
      </div>
    </div>
  );
}
