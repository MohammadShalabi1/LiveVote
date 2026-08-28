import { useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

type CreatePollData = {
  question: string;
  expiresAt?: string;
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
    p_expires_at: toExpirationValue(data.expiresAt),
  });

  if (error) {
    if (!isMissingCreatePollRpc(error)) {
      throw error;
    }

    return createPollWithDirectInserts({ data, creatorToken });
  }

  return {
    id: pollId,
  };
}

function isMissingCreatePollRpc(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST202" ||
    error.message?.toLowerCase().includes("create_poll") === true
  );
}

function toExpirationValue(expiresAt?: string) {
  if (!expiresAt) {
    return null;
  }

  return new Date(expiresAt).toISOString();
}

async function createPollWithDirectInserts({
  data,
  creatorToken,
}: {
  data: CreatePollData;
  creatorToken: string;
}) {
  const pollValues = {
    question: data.question.trim(),
    creator_token: creatorToken,
    expires_at: toExpirationValue(data.expiresAt),
  };

  let { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert(pollValues)
    .select()
    .single();

  if (pollError && pollError.message.includes("expires_at")) {
    const { data: fallbackPoll, error: fallbackPollError } = await supabase
      .from("polls")
      .insert({
        question: pollValues.question,
        creator_token: pollValues.creator_token,
      })
      .select()
      .single();

    poll = fallbackPoll;
    pollError = fallbackPollError;
  }

  if (pollError) {
    throw pollError;
  }

  const options = data.options.map((option, index) => ({
    poll_id: poll.id,
    label: option.text.trim(),
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
