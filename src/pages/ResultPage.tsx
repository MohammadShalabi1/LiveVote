import { useParams } from "react-router-dom";
import { useVoteResult } from "../hooks/useVoteResult";
import { usePoll } from "../hooks/usePoll";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import ResultsBar from "../components/ResultsBar";
import { useDataChart } from "../hooks/useDataChart";
import { ResultsChart } from "../components/ResultsChart";

export default function ResultPage() {
  const { id } = useParams();

  const { data: votes, isLoading, error } = useVoteResult(id!);
  const { data: poll } = usePoll(id!);

  const [liveVotes, setLiveVotes] = useState<any[]>([]);

  useEffect(() => {
    if (votes) {
      setLiveVotes(votes);
    }
  }, [votes]);

  useEffect(() => {
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
        (payload) => {
          setLiveVotes((previous) => [
            ...previous,
            payload.new as any,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const { results } = useDataChart(poll, liveVotes);
  const totalVotes = results.reduce((sum: number, item: any) => sum + item.count, 0);

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/40">
          <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" />
          <p className="text-sm text-slate-600">Loading poll results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm shadow-rose-200/40">
          <h1 className="text-2xl font-semibold text-slate-900">Unable to load results</h1>
          <p className="mt-3 text-sm text-slate-600">There was a problem fetching votes. Please refresh or try again later.</p>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/40">
          <h1 className="text-2xl font-semibold text-slate-900">Poll not found</h1>
          <p className="mt-3 text-sm text-slate-600">The poll you are looking for does not exist or has been removed.</p>
        </div>
      </div>
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
