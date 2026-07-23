import { useParams } from "react-router-dom";
import { usePoll } from "../hooks/usePoll";
import { useVoterToken } from "../hooks/useVoterToken";
import { useHasVoted } from "../hooks/useHasVoted";
import { useVote } from "../hooks/useVote";
import { useState } from "react";

export default function VotePage() {
  const [message, setMessage] = useState("");

  const { id } = useParams();

  const { data: poll, isLoading, error } = usePoll(id!);

  const voterToken = useVoterToken();

  const {
    data: hasVoted,
    isLoading: hasVotedLoading,
  } = useHasVoted(id!, voterToken);

  const vote = useVote();

  if (isLoading) {
    return <p>Loading poll...</p>;
  }

  if (error) {
    return <p>Error loading poll: {error.message}</p>;
  }

  if (!poll) {
    return <p>Poll not found.</p>;
  }

  if (hasVotedLoading) {
    return <p>Checking your vote...</p>;
  }

  // Block voting if poll is closed
  if (poll.is_closed) {
    return (
      <div>
        <h1>{poll.question}</h1>

        <p>
          This poll is closed. Voting is no longer available.
        </p>
      </div>
    );
  }

  // Block voting if user already voted
  if (hasVoted) {
    return (
      <div>
        <h1>{poll.question}</h1>

        <p>
          You already voted.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>{poll.question}</h1>

      {message && <p>{message}</p>}

      {poll.options.map((option: any) => (
        <div key={option.id}>
          <button
            onClick={() =>
              vote.mutate(
                {
                  pollId: id!,
                  optionId: option.id,
                  voterToken,
                },
                {
                  onSuccess: () => {
                    setMessage("Vote submitted successfully!");
                  },

                  onError: (error: any) => {
                    if (error.code === "23505") {
                      setMessage("You already voted.");
                    } 
                    else if (error.message === "Poll is closed") {
                      setMessage("This poll is closed.");
                    } 
                    else {
                      setMessage("Something went wrong.");
                    }
                  },
                }
              )
            }
          >
            {option.label}
          </button>
        </div>
      ))}
    </div>
  );
}