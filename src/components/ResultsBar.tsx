interface ResultsBarProps {
  label: string;
  value: number;
  max: number;
}

export default function ResultsBar({ label, value, max }: ResultsBarProps) {
  const width = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-cyan-500 transition-all duration-300" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
