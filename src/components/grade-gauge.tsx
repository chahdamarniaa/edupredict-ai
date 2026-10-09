export function GradeGauge({ value, min, max }: { value: number; min: number; max: number }) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const r = 80;
  const len = Math.PI * r;
  return (
    <figure className="flex flex-col items-center" aria-label={`Predicted grade ${value.toFixed(1)} on a ${min} to ${max} scale`}>
      <svg viewBox="0 0 200 115" className="w-full max-w-xs" role="img" aria-hidden>
        <defs>
          <linearGradient id="gauge" x1="0" x2="1">
            <stop offset="0%" stopColor="var(--chart-3)" />
            <stop offset="60%" stopColor="var(--chart-1)" />
            <stop offset="100%" stopColor="var(--chart-2)" />
          </linearGradient>
        </defs>
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="var(--muted)" strokeWidth="16" strokeLinecap="round" />
        <path
          d="M20 100 A80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gauge)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - pct)}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <figcaption className="-mt-16 text-center">
        <span className="block font-mono text-5xl font-semibold text-foreground">{value.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">
          out of {max} (scale {min}–{max})
        </span>
      </figcaption>
    </figure>
  );
}
