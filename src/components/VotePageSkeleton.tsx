export default function VotePageSkeleton() {
  return (
    <div className="mx-auto max-w-xl rounded-[2rem] border border-slate-800/90 bg-slate-950/90 p-8 shadow-2xl shadow-black/20">
      <div className="h-10 w-5/6 rounded-full bg-slate-800 animate-pulse" />
      <div className="mt-8 space-y-4">
        <div className="h-14 w-full rounded-3xl bg-slate-800 animate-pulse" />
        <div className="h-14 w-full rounded-3xl bg-slate-800 animate-pulse" />
        <div className="h-14 w-full rounded-3xl bg-slate-800 animate-pulse" />
      </div>
    </div>
  );
}