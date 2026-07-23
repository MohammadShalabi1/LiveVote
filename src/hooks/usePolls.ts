import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { useCreatorToken } from "./useCreatorToken";

export function usePolls() {
  const  token = useCreatorToken();
  return useQuery({
    queryKey: ["polls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("polls")
        .select(`
          id,
          question,
          options (
            id,
            label
          )
        `).eq("creator_token", token);

      if (error) {
        throw error;
      }

      return data;
    },
  });
}