import { supabase } from "../lib/supabaseClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useClosePoll() {

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pollId:string) => {

      const { error } = await supabase
        .from("polls")
        .update({
          is_closed: true
        })
        .eq("id", pollId);

      if(error){
        throw error;
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:["polls"]
      });
    }
  });
}