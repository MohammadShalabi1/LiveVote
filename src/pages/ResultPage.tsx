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

  // Local state for realtime updates
  const [liveVotes, setLiveVotes] = useState<any[]>([]);

  // Initialize liveVotes when the query finishes
  useEffect(() => {
    if (votes) {
      setLiveVotes(votes);
    }
  }, [votes]);

  // Subscribe to new votes
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

  // Compute chart data using the realtime votes
  const { results } = useDataChart(poll, liveVotes);

  if (isLoading) {
    return <p>Loading results...</p>;
  }

  if (error) {
    return <p>Error loading results: {error.message}</p>;
  }

  if (!poll) {
    return <p>Poll not found.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-3xl font-bold">
        {poll.question}
      </h1>

      {/* Animated progress bars */}
      <div className="space-y-6">
        {results.map((result: any) => (
          <ResultsBar
            key={result.id}
            text={result.text}
            count={result.count}
            percentage={result.percentage}
          />
        ))}
      </div>

      {/* Recharts Bar Chart */}
      <div className="mt-10 h-80">
        <ResultsChart results={results} />
      </div>
    </div>
  );
}