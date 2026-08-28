import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

async function hasVoted({
  pollId,
  voterId,
}: {
  pollId: string;
  voterId: string;
}) {
  const { data, error } = await supabase
    .from("votes")
    .select()
    .eq("poll_id", pollId)
    .eq("voter_token", voterId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data !== null;
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
