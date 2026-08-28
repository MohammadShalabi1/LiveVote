import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageState from "../components/PageState";
import ResultsBar from "../components/ResultsBar";
import { ResultsChart } from "../components/ResultsChart";
import { useCreatorToken } from "../hooks/useCreatorToken";
import { useDataChart } from "../hooks/useDataChart";
import { usePoll } from "../hooks/usePoll";
import { isResultsHiddenError, useVoteResult } from "../hooks/useVoteResult";
import { useVoterToken } from "../hooks/useVoterToken";
import {
  getHiddenResultsMessage,
  normalizeResultsVisibility,
} from "../lib/resultVisibility";
import { supabase } from "../lib/supabaseClient";

type RealtimeStatus = "idle" | "connected" | "disconnected";

export default function ResultPage() {
  const { id } = useParams();
  const voterId = useVoterToken();
  const creatorToken = useCreatorToken();
  const queryClient = useQueryClient();
  const [realtimeStatus, setRealtimeStatus] =
    useState<RealtimeStatus>("idle");

  const {
    data: votes,
    isLoading,
    error,
    refetch: refetchResults,
  } = useVoteResult(id!, voterId, creatorToken);
  const {
    data: poll,
    isLoading: pollLoading,
    error: pollError,
    refetch: refetchPoll,
  } = usePoll(id!);
  const resultsHidden = isResultsHiddenError(error);

  useEffect(() => {
    if (!id || !votes || resultsHidden) {
      return;
    }

    const channel = supabase
      .channel(`votes-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "votes",
          filter: `poll_id=eq.${id}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["voteResult", id, voterId, creatorToken],
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("connected");
        }

        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setRealtimeStatus("disconnected");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [creatorToken, id, queryClient, resultsHidden, voterId, votes]);

  const { results } = useDataChart(poll, votes);
  const totalVotes = results.reduce(
    (sum: number, item: any) => sum + item.count,
    0
  );

  if (isLoading || pollLoading) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/40">
          <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" />
          <p className="text-sm text-slate-600">Loading poll results...</p>
        </div>
      </div>
    );
  }

  if (pollError) {
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
        message="The poll you are looking for does not exist or has been removed."
        icon="?"
      />
    );
  }

  if (resultsHidden) {
    return (
      <PageState
        title="Results are hidden"
        message={getHiddenResultsMessage(
          normalizeResultsVisibility(poll.results_visibility)
        )}
        tone="info"
        icon="!"
      />
    );
  }

  if (error) {
    return (
      <PageState
        title="Unable to load results"
        message="There was a problem fetching results. Please check your connection and try again."
        tone="error"
        icon="!"
        actions={[{ label: "Retry", onClick: () => refetchResults() }]}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40 sm:p-10">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-indigo-600/80">Results</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">{poll.question}</h1>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              Total votes: <span className="text-slate-900">{totalVotes}</span>
            </div>
          </div>

          {realtimeStatus === "disconnected" && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Live updates are disconnected. The results below still work, and you can retry fetching the latest totals.
              <button
                type="button"
                onClick={() => refetchResults()}
                className="ml-3 font-semibold text-amber-900 underline underline-offset-2"
              >
                Retry
              </button>
            </div>
          )}

          {totalVotes === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600 shadow-sm shadow-slate-200/30">
              <h2 className="text-xl font-semibold text-slate-900">No votes yet</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Share your poll link and come back when voters have responded.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                {results.map((result: any) => (
                  <ResultsBar
                    key={result.id}
                    text={result.text}
                    count={result.count}
                    percentage={result.percentage}
                  />
                ))}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm shadow-slate-200/30">
                <div className="h-80">
                  <ResultsChart results={results} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
