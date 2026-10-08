// Medidor da nota do PC. O arco usa as duas cores do logo: âmbar para a
// parte conquistada, marinho para o que falta.
export function Gauge({ score, size = 220 }: { score: number; size?: number }) {
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const arc = c * 0.75; // 270°
  const filled = arc * Math.max(0, Math.min(100, score)) / 100;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[135deg]" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.13)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${c}`}
        />
        <circle
          key={score}
          className="gauge-arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-amber)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
          style={{ ["--len" as string]: `${filled}` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[68px] leading-none num" aria-label={`Nota ${score} de 100`}>
          {score}
        </span>
        <span className="text-fg/60 text-sm mt-1">de 100</span>
      </div>
    </div>
  );
}
