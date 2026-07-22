import { useParams } from "react-router-dom";
import { useVoteResult } from "../hooks/useVoteResult";
import { usePoll } from "../hooks/usePoll";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ResultPage() {
  const { id } = useParams();

  const { data: votes, isLoading, error } = useVoteResult(id!);
  const { data: poll } = usePoll(id!);

  // Local state that will be updated in real time
  const [liveVotes, setLiveVotes] = useState<any[]>([]);

  // Load the initial votes into local state
  useEffect(() => {
    if (votes) {
      setLiveVotes(votes);
    }
  }, [votes]);

  // Subscribe to new votes
  useEffect(() => {
    console.log("Starting subscription...");

    const channel = supabase
      .channel("votes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "votes",
          filter: `poll_id=eq.${id}`,
        },
        (payload) => {
          console.log("New vote received:", payload);

          // Add the new vote to the local state
          setLiveVotes((previous) => [
            ...previous,
            payload.new as any,
          ]);
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      console.log("Removing subscription...");
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (isLoading) {
    return <p>Loading results...</p>;
  }

  if (error) {
    return <p>Error loading results: {error.message}</p>;
  }

  if (!poll) {
    return <p>Poll not found.</p>;
  }

  // Count votes from the LIVE state
  const counts = liveVotes.reduce((acc: any, vote) => {
    acc[vote.option_id] = (acc[vote.option_id] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h1>{poll.question}</h1>

      {poll.options.map((option: any) => (
        <p key={option.id}>
          {option.label}: {counts[option.id] || 0} votes
        </p>
      ))}
    </div>
  );
}