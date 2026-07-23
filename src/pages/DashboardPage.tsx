import PollCard from "../components/PollCard";
import { usePolls } from "../hooks/usePolls";

export default function DashboardPage() {
  const {
    data: polls,
    isLoading,
    error,
  } = usePolls();

  if (isLoading) {
    return <p>Loading polls...</p>;
  }

  if (error) {
    return <p>Error loading polls</p>;
  }

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-3xl font-bold">
        Dashboard
      </h1>

      {polls?.map((poll) => (
        <PollCard
          key={poll.id}
          poll={poll}
        />
      ))}
    </div>
  );
}