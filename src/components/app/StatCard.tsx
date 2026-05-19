export function StatCard({
  label,
  value,
  sub,
  tone = "muted",
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "signal" | "warn" | "block" | "muted";
}) {
  const cls =
    tone === "signal"
      ? "text-signal"
      : tone === "warn"
        ? "text-warn"
        : tone === "block"
          ? "text-block"
          : "text-foreground";
  return (
    <div className="rounded-xl border bg-surface/60 backdrop-blur-sm px-4 py-3.5">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`text-2xl font-semibold tabular-nums mt-1 ${cls}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
