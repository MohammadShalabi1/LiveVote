import { useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import {
  DEFAULT_RESULTS_VISIBILITY,
  ResultsVisibility,
} from "../lib/resultVisibility";

type CreatePollData = {
  question: string;
  expiresAt?: string;
  resultsVisibility?: ResultsVisibility;
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
  const expiresAt = toExpirationValue(data.expiresAt);
  const resultsVisibility =
    data.resultsVisibility ?? DEFAULT_RESULTS_VISIBILITY;

  const { data: pollId, error } = await supabase.rpc("create_poll", {
    p_question: data.question,
    p_options: data.options,
    p_creator_token: creatorToken,
    p_expires_at: expiresAt,
    p_results_visibility: resultsVisibility,
  });

  if (error) {
    if (!isMissingCreatePollRpc(error)) {
      throw error;
    }

    const expirationPoll = await createPollWithExpirationRpc({
      data,
      creatorToken,
      expiresAt,
    });

    if (expirationPoll) {
      return expirationPoll;
    }

    if (!expiresAt) {
      const legacyPoll = await createPollWithLegacyRpc({
        data,
        creatorToken,
      });

      if (legacyPoll) {
        return legacyPoll;
      }
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

async function createPollWithExpirationRpc({
  data,
  creatorToken,
  expiresAt,
}: {
  data: CreatePollData;
  creatorToken: string;
  expiresAt: string | null;
}) {
  const { data: pollId, error } = await supabase.rpc("create_poll", {
    p_question: data.question,
    p_options: data.options,
    p_creator_token: creatorToken,
    p_expires_at: expiresAt,
  });

  if (!error) {
    return {
      id: pollId,
    };
  }

  if (!isMissingCreatePollRpc(error)) {
    throw error;
  }

  return null;
}

async function createPollWithLegacyRpc({
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

  if (!error) {
    return {
      id: pollId,
    };
  }

  if (!isMissingCreatePollRpc(error)) {
    throw error;
  }

  return null;
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
    results_visibility: data.resultsVisibility ?? DEFAULT_RESULTS_VISIBILITY,
  };

  const pollPayloads: Record<string, string | null>[] = [
    pollValues,
    {
      question: pollValues.question,
      creator_token: pollValues.creator_token,
      results_visibility: pollValues.results_visibility,
    },
    {
      question: pollValues.question,
      creator_token: pollValues.creator_token,
      expires_at: pollValues.expires_at,
    },
    {
      question: pollValues.question,
      creator_token: pollValues.creator_token,
    },
  ];

  let poll = null;
  let pollError = null;

  for (const payload of pollPayloads) {
    const { data: createdPoll, error: createError } = await supabase
      .from("polls")
      .insert(payload)
      .select()
      .single();

    if (!createError) {
      poll = createdPoll;
      pollError = null;
      break;
    }

    pollError = createError;

    if (!isMissingCompatibilityColumn(createError)) {
      break;
    }
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

function isMissingCompatibilityColumn(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42703" ||
    message.includes("expires_at") ||
    message.includes("results_visibility")
  );
}


export function useCreatePoll() {
  return useMutation({
    mutationFn: createPoll,
  });
}
