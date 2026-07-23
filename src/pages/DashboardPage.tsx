import { useNavigate } from "react-router-dom";
import PollCard from "../components/PollCard";
import { usePolls } from "../hooks/usePolls";
import DashboardSkeleton from "../components/DashboardSkeleton";

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    data: polls,
    isLoading,
    error,
  } = usePolls();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl rounded-[2rem] border border-rose-500/20 bg-rose-500/10 p-8 text-center shadow-lg shadow-rose-500/10">
          <h1 className="text-2xl font-semibold text-rose-100">Unable to load polls</h1>
          <p className="mt-3 text-sm text-rose-200">There was an issue fetching your dashboard data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-3 pb-8 text-center">
        <p className="text-sm uppercase tracking-[0.28em] text-indigo-600/80">Creator dashboard</p>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">My Polls</h1>
        <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
          Manage and track your created polls in one polished space. Review active polls, voter counts, and close polls when you're ready.
        </p>
      </div>

      {polls?.length ? (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {polls.map((poll) => (
            <PollCard key={poll.id} poll={poll} />
          ))}
        </div>
      ) : (
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/50">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-100 text-2xl text-indigo-600">
            +
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">You haven't created any polls yet</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Create your first poll and start collecting responses from your audience.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-8 inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            Create your first poll
          </button>
        </div>
      )}
    </div>
  );
}