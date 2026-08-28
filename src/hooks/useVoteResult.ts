import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

export type PollResultRow = {
  option_id: string;
  label: string;
  position: number;
  vote_count: number | string;
};

async function fetchVoteResult({
  pollId,
  voterId,
  creatorToken,
}: {
  pollId: string;
  voterId: string;
  creatorToken: string;
}) {
  const { data, error } = await supabase.rpc("get_poll_results", {
    p_poll_id: pollId,
    p_voter_id: voterId,
    p_creator_token: creatorToken,
  });

  if (error) {
    if (!isMissingResultsRpc(error)) {
      throw error;
    }

    const legacyResult = await supabase
      .from("votes")
      .select("option_id")
      .eq("poll_id", pollId);

    if (legacyResult.error) {
      throw legacyResult.error;
    }

    return legacyResult.data;
  }

  return data as PollResultRow[];
}

export function useVoteResult(
  pollId: string,
  voterId: string,
  creatorToken: string
) {
  return useQuery({
    queryKey: ["voteResult", pollId, voterId, creatorToken],
    queryFn: () => fetchVoteResult({ pollId, voterId, creatorToken }),
    enabled: !!pollId && !!voterId && !!creatorToken,
  });
}

export function isResultsHiddenError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "LV003"
  );
}

function isMissingResultsRpc(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST202" ||
    error.message?.toLowerCase().includes("get_poll_results") === true
  );
}
