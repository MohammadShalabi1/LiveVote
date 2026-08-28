import { useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

type CreatePollData = {
  question: string;
  options: {
    text: string;
  }[];
};

async function createPoll({
  data,
  creatorToken,
}: {
  data: CreatePollData;
  creatorToken: string;
}) {
  const { data: pollId, error } = await supabase.rpc("create_poll", {
    p_question: data.question,
    p_options: data.options,
    p_creator_token: creatorToken,
  });

  if (error) {
    throw error;
  }

  return {
    id: pollId,
  };
}


export function useCreatePoll() {
  return useMutation({
    mutationFn: createPoll,
  });
}
