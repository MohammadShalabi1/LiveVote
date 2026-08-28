import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { useCreatorToken } from "./useCreatorToken";
import { DEFAULT_RESULTS_VISIBILITY } from "../lib/resultVisibility";

const POLLS_SELECTS = [
  `
  id,
  question,
  options (
    id,
    label
  ),
  is_closed,
  expires_at,
  results_visibility
`,
  `
  id,
  question,
  options (
    id,
    label
  ),
  is_closed,
  expires_at
`,
  `
  id,
  question,
  options (
    id,
    label
  ),
  is_closed
`,
];

export function usePolls() {
  const token = useCreatorToken();
  return useQuery({
    queryKey: ["polls", token],
    queryFn: async () => {
      const polls = await fetchPolls(token);

      return Promise.all(
        polls.map(async (poll) => ({
          ...poll,
          vote_count: await fetchPollVoteCount(poll.id, token),
        }))
      );
    },
  });
}

async function fetchPolls(token: string) {
  let lastError = null;

  for (const select of POLLS_SELECTS) {
    const { data, error } = await supabase
      .from("polls")
      .select(select)
      .eq("creator_token", token);

    if (!error) {
      return (data as any[]).map((poll) => ({
        ...poll,
        expires_at: poll.expires_at ?? null,
        results_visibility:
          poll.results_visibility ?? DEFAULT_RESULTS_VISIBILITY,
      }));
    }

    if (!isMissingCompatibilityColumn(error)) {
      throw error;
    }

    lastError = error;
  }

  throw lastError;
}

async function fetchPollVoteCount(pollId: string, creatorToken: string) {
  const { data, error } = await supabase.rpc("get_poll_results", {
    p_poll_id: pollId,
    p_voter_id: null,
    p_creator_token: creatorToken,
  });

  if (!error) {
    return data.reduce(
      (total: number, option: { vote_count: number | string }) =>
        total + Number(option.vote_count),
      0
    );
  }

  if (!isMissingResultsRpc(error)) {
    throw error;
  }

  const { count, error: countError } = await supabase
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("poll_id", pollId);

  if (countError) {
    throw countError;
  }

  return count ?? 0;
}

function isMissingCompatibilityColumn(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42703" ||
    message.includes("expires_at") ||
    message.includes("results_visibility")
  );
}

function isMissingResultsRpc(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST202" ||
    error.message?.toLowerCase().includes("get_poll_results") === true
  );
}
