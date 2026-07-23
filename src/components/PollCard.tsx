type PollCardProps = {
  poll: {
    id: string;
    question: string;
    options: {
      id: string;
      label: string;
    }[];
  };
};

export default function PollCard({ poll }: PollCardProps) {
  return (
    <div className="rounded-lg border p-4 shadow">
      <h2 className="text-xl font-bold">
        {poll.question}
      </h2>

      <p className="mt-2">
        {poll.options.length} options
      </p>
    </div>
  );
}