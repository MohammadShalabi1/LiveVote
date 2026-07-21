interface PollCardProps {
  title: string;
  description?: string;
}

export default function PollCard({ title, description }: PollCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
      <h2 className="text-lg font-medium text-slate-100">{title}</h2>
      {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
    </div>
  );
}
