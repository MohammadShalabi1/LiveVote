import { Link, useParams } from "react-router-dom";
import { usePoll } from "../hooks/usePoll";
import { useVoterToken } from "../hooks/useVoterToken";
import { useHasVoted } from "../hooks/useHasVoted";
import { useVote } from "../hooks/useVote";
import { useState } from "react";
import VotePageSkeleton from "../components/VotePageSkeleton";
import { formatPollExpiration, getPollStatus } from "../lib/pollStatus";
import {
  canViewResults,
  getHiddenResultsMessage,
  normalizeResultsVisibility,
} from "../lib/resultVisibility";
import { useQueryClient } from "@tanstack/react-query";
import PageState from "../components/PageState";

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function VotePage() {
  const [message, setMessage] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const { id } = useParams();
  const queryClient = useQueryClient();

  const {
    data: poll,
    isLoading,
    error,
    refetch: refetchPoll,
  } = usePoll(id!);

  const voterId = useVoterToken();

  const {
    data: hasVoted,
    isLoading: hasVotedLoading,
    error: hasVotedError,
    refetch: refetchHasVoted,
  } = useHasVoted(id!, voterId);

  const vote = useVote();

  function handleSelectOption(optionId: string) {
    setSelectedOptionId(optionId);

    if (submitState === "error") {
      setSubmitState("idle");
      setMessage("");
    }
  }

  function handleSubmitVote() {
    if (!id || !selectedOptionId || vote.isPending) {
      return;
    }

    setSubmitState("submitting");
    setMessage("");

    vote.mutate(
      {
        pollId: id,
        optionId: selectedOptionId,
        voterId,
      },
      {
        onSuccess: () => {
          setSubmitState("success");
          setMessage("Vote submitted.");
          queryClient.invalidateQueries({
            queryKey: ["hasVoted", id, voterId],
          });
          queryClient.invalidateQueries({
            queryKey: ["voteResult"],
          });
        },

        onError: (error: any) => {
          setSubmitState("error");

          if (error.code === "23505") {
            setMessage("You already voted in this browser.");
          } else if (error.code === "LV001" || error.message === "Poll is closed") {
            setMessage("This poll is closed.");
          } else {
            setMessage("Something went wrong. Please try again.");
          }
        },
      }
    );
  }

  if (isLoading) {
    return <VotePageSkeleton />;
  }

  if (error) {
    return (
      <PageState
        title="Unable to load poll"
        message="There was a problem loading this poll. Please check your connection and try again."
        tone="error"
        icon="!"
        actions={[{ label: "Retry", onClick: () => refetchPoll() }]}
      />
    );
  }

  if (!poll) {
    return (
      <PageState
        title="Poll not found"
        message="The poll link may be invalid or the poll no longer exists."
        icon="?"
      />
    );
  }

  if (!poll.options?.length) {
    return (
      <PageState
        title="This poll has no options yet"
        message="There are no choices available for this poll, so voting is not available."
        tone="warning"
        icon="!"
        actions={[{ label: "Retry", onClick: () => refetchPoll() }]}
      />
    );
  }

  if (hasVotedLoading) {
    return <VotePageSkeleton />;
  }

  if (hasVotedError) {
    return (
      <PageState
        title="Unable to check vote status"
        message="There was a problem checking whether this browser has already voted. Please try again."
        tone="error"
        icon="!"
        actions={[
          { label: "Retry", onClick: () => refetchHasVoted() },
        ]}
      />
    );
  }

  const pollStatus = getPollStatus(poll);
  const expirationLabel = formatPollExpiration(poll.expires_at);
  const resultsVisibility = normalizeResultsVisibility(poll.results_visibility);
  const viewerCanSeeResults = canViewResults({
    poll,
    hasVoted,
  });

  if (pollStatus !== "open") {
    const statusTitle = pollStatus === "closed" ? "This poll is closed." : "This poll has ended.";

    return (
      <div className="mx-auto min-h-[calc(100vh-3rem)] px-4 py-10">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
          <h1 className="text-3xl font-semibold text-slate-900">{poll.question}</h1>
          <div className="mt-6 rounded-3xl border border-amber-200/60 bg-amber-50 p-6">
            <p className="text-lg font-medium text-amber-700">{statusTitle}</p>
            <p className="mt-2 text-sm text-slate-600">Voting is no longer available, but you can still view the results.</p>
            {expirationLabel && (
              <p className="mt-2 text-sm text-slate-600">Ended {expirationLabel}</p>
            )}
            <Link
              to={`/results/${id}`}
              className="mt-5 inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              View results
            </Link>
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
            <p className="text-lg font-medium text-sky-700">
              {submitState === "success" ? "Vote submitted." : "You already voted."}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {viewerCanSeeResults
                ? "Thanks for sharing your opinion. Results are being updated in real time."
                : getHiddenResultsMessage(resultsVisibility)}
            </p>
            {viewerCanSeeResults && (
              <Link
                to={`/results/${id}`}
                className="mt-5 inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                View results
              </Link>
            )}
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
          {expirationLabel && (
            <p className="mt-3 text-sm font-medium text-slate-600">Voting ends {expirationLabel}</p>
          )}
          {!viewerCanSeeResults && (
            <p className="mt-3 text-sm font-medium text-slate-600">
              {getHiddenResultsMessage(resultsVisibility)}
            </p>
          )}
          {viewerCanSeeResults && (
            <Link
              to={`/results/${id}`}
              className="mt-4 inline-flex items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              View current results
            </Link>
          )}
        </div>

        {message && (
          <div className={`mb-6 rounded-3xl border p-4 text-sm shadow-sm ${
            submitState === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700 shadow-rose-200/40"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-200/40"
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-4">
          {poll.options.map((option: any) => {
            const isSelected = selectedOptionId === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectOption(option.id)}
                disabled={vote.isPending}
                aria-pressed={isSelected}
                className={`flex w-full items-center justify-between gap-4 rounded-3xl border px-5 py-5 text-left text-lg font-semibold shadow-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 active:bg-slate-100 disabled:cursor-wait disabled:opacity-70 ${
                  isSelected
                    ? "border-indigo-400 bg-indigo-50 text-indigo-950 shadow-indigo-100"
                    : "border-slate-200 bg-slate-50 text-slate-900 shadow-slate-200/40 hover:border-indigo-200 hover:bg-indigo-50"
                }`}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <span className="shrink-0 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSubmitVote}
          disabled={!selectedOptionId || vote.isPending}
          className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
        >
          {vote.isPending && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
          )}
          {vote.isPending
            ? "Submitting..."
            : submitState === "error"
              ? "Retry vote"
              : "Submit vote"}
        </button>
      </div>
    </div>
  );
}
