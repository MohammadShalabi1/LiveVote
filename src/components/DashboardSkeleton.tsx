export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="mx-auto h-12 w-2/3 rounded-full bg-slate-800/80 animate-pulse" />
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <div className="h-48 rounded-3xl bg-slate-900/80 p-6 animate-pulse" />
        <div className="h-48 rounded-3xl bg-slate-900/80 p-6 animate-pulse" />
        <div className="h-48 rounded-3xl bg-slate-900/80 p-6 animate-pulse" />
      </div>
    </div>
  );
}