import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

async function hasVoted({
  pollId,
  voterId,
}: {
  pollId: string;
  voterId: string;
}) {
  const { data, error } = await supabase.rpc("has_voted", {
    p_poll_id: pollId,
    p_voter_id: voterId,
  });

  if (error) {
    if (!isMissingHasVotedRpc(error)) {
      throw error;
    }

    const legacyResult = await supabase
      .from("votes")
      .select()
      .eq("poll_id", pollId)
      .eq("voter_token", voterId)
      .maybeSingle();

    if (legacyResult.error) {
      throw legacyResult.error;
    }

    return legacyResult.data !== null;
  }

  return data === true;
}

export function useHasVoted(
  pollId: string,
  voterId: string
) {
  return useQuery({
    queryKey: ["hasVoted", pollId, voterId],
    queryFn: () => hasVoted({ pollId, voterId }),
    enabled: !!pollId && !!voterId,
  });
}

function isMissingHasVotedRpc(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST202" ||
    error.message?.toLowerCase().includes("has_voted") === true
  );
}
