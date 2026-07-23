type ResultsBarProps = {
  text: string;
  count: number;
  percentage: number;
};

export default function ResultsBar({
  text,
  count,
  percentage,
}: ResultsBarProps) {
  return (
    <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">{text}</h3>

        <span className="text-sm text-slate-600">
          {count} vote{count !== 1 ? "s" : ""} • {percentage.toFixed(1)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-500 ease-in-out"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}