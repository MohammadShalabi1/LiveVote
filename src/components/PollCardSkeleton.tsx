export default function PollCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-800/90 bg-slate-950/80 p-6 shadow-lg shadow-black/20">
      <div className="h-6 w-3/4 rounded-full bg-slate-800" />
      <div className="mt-4 space-y-3">
        <div className="h-4 w-1/2 rounded-full bg-slate-800" />
        <div className="h-4 w-1/3 rounded-full bg-slate-800" />
      </div>
      <div className="mt-6 h-10 w-28 rounded-full bg-slate-800" />
    </div>
  );
}