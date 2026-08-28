import { getPollStatus } from "./pollStatus";

export type ResultsVisibility = "always" | "after_vote" | "after_close";

type PollWithResultsVisibility = {
  results_visibility?: ResultsVisibility | null;
  is_closed?: boolean | null;
  expires_at?: string | null;
};

export const DEFAULT_RESULTS_VISIBILITY: ResultsVisibility = "always";

export function normalizeResultsVisibility(
  value?: string | null
): ResultsVisibility {
  if (
    value === "always" ||
    value === "after_vote" ||
    value === "after_close"
  ) {
    return value;
  }

  return DEFAULT_RESULTS_VISIBILITY;
}

export function canViewResults({
  poll,
  hasVoted,
  isCreator,
}: {
  poll: PollWithResultsVisibility;
  hasVoted?: boolean;
  isCreator?: boolean;
}) {
  if (isCreator) {
    return true;
  }

  const visibility = normalizeResultsVisibility(poll.results_visibility);

  if (visibility === "always") {
    return true;
  }

  if (visibility === "after_vote") {
    return hasVoted === true;
  }

  return getPollStatus(poll) !== "open";
}

export function getHiddenResultsMessage(
  visibility?: ResultsVisibility | null
) {
  if (visibility === "after_vote") {
    return "Results will be available after you vote.";
  }

  if (visibility === "after_close") {
    return "Results will be available after this poll ends.";
  }

  return "Results are not available yet.";
}
