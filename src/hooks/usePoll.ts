import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

async function fetchPoll(id: string) {
  const { data, error } = await supabase
    .from("polls")
    .select(`
      *,
      options (
        id,
        label,
        position
      ),is_closed,
      expires_at
    `)
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function usePoll(id: string) {
  return useQuery({
    queryKey: ["poll", id],
    queryFn: () => fetchPoll(id),
    enabled: !!id,
  });
}
