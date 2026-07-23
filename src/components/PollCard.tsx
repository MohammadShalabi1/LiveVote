import { useNavigate } from "react-router-dom";
import { useClosePoll } from "../hooks/useClosePoll";

type PollCardProps = {
  poll:{
    id:string;
    question:string;
    options:{
      id:string;
      label:string;
    }[];
    votes:{
      id:string;
    }[];
    is_closed:boolean;
  };
};

export default function PollCard({ poll }: PollCardProps) {
  const navigate = useNavigate();
  const closePoll = useClosePoll();

  return (
    <div
      onClick={() => navigate(`/results/${poll.id}`)}
      className="cursor-pointer rounded-lg border p-4 shadow hover:bg-gray-100"
    >
      <h2 className="text-xl font-bold">
        {poll.question}
      </h2>

      <p>
        {poll.options.length} options
      </p>

      <p>
        {poll.votes.length} voters
      </p>

      <button
        onClick={(e) => {
          e.stopPropagation();

          closePoll.mutate(poll.id);
        }}
        className="mt-3 rounded bg-red-500 px-3 py-1 text-white"
      >
        Close Poll
      </button>

    </div>
  );
}