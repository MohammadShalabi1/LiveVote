import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

export function useDeletePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pollId: string) => {
      const { error } = await supabase
        .from("polls")
        .delete()
        .eq("id", pollId);

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