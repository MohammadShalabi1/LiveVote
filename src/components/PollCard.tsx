import { useNavigate } from "react-router-dom";

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
  };
};

export default function PollCard({ poll }: PollCardProps) {
  const navigate = useNavigate();

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
    </div>
  );
}