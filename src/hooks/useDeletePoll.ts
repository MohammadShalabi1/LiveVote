import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

export function useDeletePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pollId,
      creatorToken,
    }: {
      pollId: string;
      creatorToken: string;
    }) => {
      const { error } = await supabase.rpc("delete_poll", {
        p_poll_id: pollId,
        p_creator_token: creatorToken,
      });

      if (error) {
        throw error;
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["polls"],
      });
    },
  });
}
