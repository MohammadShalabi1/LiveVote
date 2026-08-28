import { useParams } from "react-router-dom";
import { usePoll } from "../hooks/usePoll";
import { useVoterToken } from "../hooks/useVoterToken";
import { useHasVoted } from "../hooks/useHasVoted";
import { useVote } from "../hooks/useVote";
import { useState } from "react";
import VotePageSkeleton from "../components/VotePageSkeleton";

export default function VotePage() {
  const [message, setMessage] = useState("");

  const { id } = useParams();

  const { data: poll, isLoading, error } = usePoll(id!);

  const voterId = useVoterToken();

  const {
    data: hasVoted,
    isLoading: hasVotedLoading,
  } = useHasVoted(id!, voterId);

  const vote = useVote();

  if (isLoading) {
    return <VotePageSkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm shadow-rose-200/40">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-rose-100 text-2xl text-rose-600">
            !
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Unable to load poll</h1>
          <p className="mt-3 text-sm text-slate-600">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/40">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-600">
            ?
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Poll not found</h1>
          <p className="mt-3 text-sm text-slate-600">The poll link may be invalid or the poll no longer exists.</p>
        </div>
      </div>
    );
  }

  if (hasVotedLoading) {
    return <VotePageSkeleton />;
  }

  if (poll.is_closed) {
    return (
      <div className="mx-auto min-h-[calc(100vh-3rem)] px-4 py-10">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
          <h1 className="text-3xl font-semibold text-slate-900">{poll.question}</h1>
          <div className="mt-6 rounded-3xl border border-amber-200/60 bg-amber-50 p-6">
            <p className="text-lg font-medium text-amber-700">This poll is closed.</p>
            <p className="mt-2 text-sm text-slate-600">Voting is no longer available, but you can still view the results.</p>
          </div>
        </div>
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div className="mx-auto min-h-[calc(100vh-3rem)] px-4 py-10">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
          <h1 className="text-3xl font-semibold text-slate-900">{poll.question}</h1>
          <div className="mt-6 rounded-3xl border border-sky-200/70 bg-sky-50 p-6">
            <p className="text-lg font-medium text-sky-700">You already voted.</p>
            <p className="mt-2 text-sm text-slate-600">Thanks for sharing your opinion. Results are being updated in real time.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-3rem)] px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.32em] text-indigo-600/80">LiveVote</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">{poll.question}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">Pick one option below to submit your vote. Your response will be recorded instantly.</p>
        </div>

        {message && (
          <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 shadow-sm shadow-emerald-200/40">
            {message}
          </div>
        )}

        <div className="space-y-4">
          {poll.options.map((option: any) => (
            <button
              key={option.id}
              onClick={() =>
                vote.mutate(
                  {
                    pollId: id!,
                    optionId: option.id,
                    voterId,
                  },
                  {
                    onSuccess: () => {
                      setMessage("Vote submitted successfully!");
                    },

                    onError: (error: any) => {
                      if (error.code === "23505") {
                        setMessage("You already voted in this browser.");
                      } else if (error.message === "Poll is closed") {
                        setMessage("This poll is closed.");
                      } else {
                        setMessage("Something went wrong.");
                      }
                    },
                  }
                )
              }
              disabled={vote.isPending}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5 text-left text-lg font-semibold text-slate-900 shadow-sm shadow-slate-200/40 transition duration-200 hover:border-indigo-200 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 active:bg-slate-100"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
