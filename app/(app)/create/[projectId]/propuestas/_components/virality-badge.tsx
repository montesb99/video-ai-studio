export function ViralityBadge({ score, reason }: { score: number; reason: string | null }) {
  const color = score >= 75 ? "text-success" : score >= 50 ? "text-warning" : "text-white/44";
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className={`text-lg leading-none font-semibold ${color}`}>{score}</span>
      {reason && <span className="max-w-[140px] text-right text-[11px] text-white/44">{reason}</span>}
    </div>
  );
}
