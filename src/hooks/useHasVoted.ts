import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

async function hasVoted({
  pollId,
  voterToken,
}: {
  pollId: string;
  voterToken: string;
}) {
  const { data, error } = await supabase
    .from("votes")
    .select()
    .eq("poll_id", pollId)
    .eq("voter_token", voterToken)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data !== null;
}

export function useHasVoted(
  pollId: string,
  voterToken: string
) {
  return useQuery({
    queryKey: ["hasVoted", pollId, voterToken],
    queryFn: () => hasVoted({ pollId, voterToken }),
    enabled: !!pollId && !!voterToken,
  });
}