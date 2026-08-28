import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { DEFAULT_RESULTS_VISIBILITY } from "../lib/resultVisibility";

const POLL_SELECTS = [
  `
  id,
  question,
  is_closed,
  options (
    id,
    label,
    position
  ),
  expires_at,
  results_visibility
`,
  `
  id,
  question,
  is_closed,
  options (
    id,
    label,
    position
  ),
  expires_at
`,
  `
  id,
  question,
  is_closed,
  options (
    id,
    label,
    position
  )
`,
];

async function fetchPoll(id: string) {
  let lastError = null;

  for (const select of POLL_SELECTS) {
    const { data, error } = await supabase
      .from("polls")
      .select(select)
      .eq("id", id)
      .maybeSingle();

    if (!error) {
      if (!data) {
        return null;
      }

      const poll = data as any;

      return {
        ...poll,
        expires_at: poll.expires_at ?? null,
        results_visibility:
          poll.results_visibility ?? DEFAULT_RESULTS_VISIBILITY,
      };
    }

    if (!isMissingCompatibilityColumn(error)) {
      throw error;
    }

    lastError = error;
  }

  throw lastError;
}

export function usePoll(id: string) {
  return useQuery({
    queryKey: ["poll", id],
    queryFn: () => fetchPoll(id),
    enabled: !!id,
  });
}

function isMissingCompatibilityColumn(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42703" ||
    message.includes("expires_at") ||
    message.includes("results_visibility")
  );
}
