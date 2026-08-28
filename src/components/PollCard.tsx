import { useNavigate } from "react-router-dom";
import { useClosePoll } from "../hooks/useClosePoll";
import { useDeletePoll } from "../hooks/useDeletePoll";
import { useCreatorToken } from "../hooks/useCreatorToken";
import { formatPollExpiration, getPollStatus, getPollStatusLabel } from "../lib/pollStatus";

type PollCardProps = {
  poll:{
    id:string;
    question:string;
    options:{
      id:string;
      label:string;
    }[];
    vote_count: number;
    is_closed:boolean;
    expires_at?: string | null;
  };
};

export default function PollCard({ poll }: PollCardProps) {
  const navigate = useNavigate();
  const closePoll = useClosePoll();
  const deletePoll = useDeletePoll();
  const creatorToken = useCreatorToken();
  const status = getPollStatus(poll);
  const expirationLabel = formatPollExpiration(poll.expires_at);

  return (
    <div
      onClick={() => navigate(`/results/${poll.id}`)}
      className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{poll.question}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{poll.options.length} options · {poll.vote_count} voters</p>
        </div>
        <span className={`inline-flex rounded-2xl px-3 py-1 text-xs font-semibold ${status === "open" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"}`}>
          {getPollStatusLabel(status)}
        </span>
      </div>

      {expirationLabel && (
        <p className="mt-4 text-sm text-slate-500">
          Ends {expirationLabel}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">Tap to view poll results</p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              closePoll.mutate({
                pollId: poll.id,
                creatorToken,
              });
            }}
            className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-200"
          >
            Close Poll
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();

              const confirmed = window.confirm(
                "Are you sure you want to delete this poll? This action cannot be undone."
              );

              if (confirmed) {
                deletePoll.mutate({
                  pollId: poll.id,
                  creatorToken,
                });
              }
            }}
            className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-200"
          >
            Delete Poll
          </button>
          <button
            onClick={(e) => {e.stopPropagation();navigate(`/poll-created/${poll.id}`);}}
            className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-200"
          >
            See your poll Qr code and link
          </button>
        </div>
      </div>

    </div>
  );
}
