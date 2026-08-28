import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

const POLL_SELECT = `
  *,
  options (
    id,
    label,
    position
  ),
  is_closed,
  expires_at
`;

const LEGACY_POLL_SELECT = `
  *,
  options (
    id,
    label,
    position
  ),
  is_closed
`;

async function fetchPoll(id: string) {
  let { data, error } = await supabase
    .from("polls")
    .select(POLL_SELECT)
    .eq("id", id)
    .single();

  if (error && isMissingExpiresAtColumn(error)) {
    const legacyResult = await supabase
      .from("polls")
      .select(LEGACY_POLL_SELECT)
      .eq("id", id)
      .single();

    data = legacyResult.data
      ? {
          ...legacyResult.data,
          expires_at: null,
        }
      : legacyResult.data;
    error = legacyResult.error;
  }

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

function isMissingExpiresAtColumn(error: { code?: string; message?: string }) {
  return (
    error.code === "42703" ||
    error.message?.toLowerCase().includes("expires_at") === true
  );
}
