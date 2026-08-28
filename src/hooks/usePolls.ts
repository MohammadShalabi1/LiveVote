import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { useCreatorToken } from "./useCreatorToken";

const POLLS_SELECT = `
  id,
  question,
  options (
    id,
    label
  ),
  votes (
    id
  ),
  is_closed,
  expires_at
`;

const LEGACY_POLLS_SELECT = `
  id,
  question,
  options (
    id,
    label
  ),
  votes (
    id
  ),
  is_closed
`;

export function usePolls() {
  const token = useCreatorToken();
  return useQuery({
    queryKey: ["polls", token],
    queryFn: async () => {
      let { data, error } = await supabase
        .from("polls")
        .select(POLLS_SELECT)
        .eq("creator_token", token);

      if (error && isMissingExpiresAtColumn(error)) {
        const legacyResult = await supabase
          .from("polls")
          .select(LEGACY_POLLS_SELECT)
          .eq("creator_token", token);

        data = legacyResult.data
          ? legacyResult.data.map((poll) => ({
              ...poll,
              expires_at: null,
            }))
          : legacyResult.data;
        error = legacyResult.error;
      }

      if (error) {
        throw error;
      }

      return data;
    },
  });
}

function isMissingExpiresAtColumn(error: { code?: string; message?: string }) {
  return (
    error.code === "42703" ||
    error.message?.toLowerCase().includes("expires_at") === true
  );
}
