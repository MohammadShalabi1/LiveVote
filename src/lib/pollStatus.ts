export type PollStatus = "open" | "closed" | "ended";

type PollWithStatus = {
  is_closed?: boolean | null;
  expires_at?: string | null;
};

export function getPollStatus(poll: PollWithStatus): PollStatus {
  if (poll.is_closed) {
    return "closed";
  }

  if (poll.expires_at && new Date(poll.expires_at).getTime() <= Date.now()) {
    return "ended";
  }

  return "open";
}

export function getPollStatusLabel(status: PollStatus) {
  if (status === "closed") {
    return "Closed";
  }

  if (status === "ended") {
    return "Ended";
  }

  return "Open";
}

export function formatPollExpiration(expiresAt?: string | null) {
  if (!expiresAt) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(expiresAt));
}
