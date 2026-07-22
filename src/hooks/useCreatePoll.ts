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

  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert({
      question: data.question,
      creator_token: creatorToken,
    })
    .select()
    .single();


  if (pollError) {
    throw pollError;
  }


  const options = data.options.map((option, index) => ({
    poll_id: poll.id,
    label: option.text,
    position: index,
  }));


  const { error: optionsError } = await supabase
    .from("options")
    .insert(options);


  if (optionsError) {
    throw optionsError;
  }


  return poll;
}


export function useCreatePoll() {
  return useMutation({
    mutationFn: createPoll,
  });
}