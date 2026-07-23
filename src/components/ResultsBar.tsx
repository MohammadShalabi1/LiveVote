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
    <div className="mb-6">
      {/* Option name and vote count */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium text-gray-800">{text}</h3>

        <span className="text-sm text-gray-600">
          {count} vote{count !== 1 ? "s" : ""} ({percentage.toFixed(1)}%)
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-in-out"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}