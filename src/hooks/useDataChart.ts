import { useMemo } from "react";

type ResultRow = {
  option_id: string;
  label?: string;
  vote_count?: number | string;
};

export function useDataChart(poll:any, votes:any) {
  return useMemo(() => {
    const hasAggregateResults =
      Array.isArray(votes) &&
      votes.some((vote: ResultRow) => "vote_count" in vote);

    if (hasAggregateResults) {
      const totalVotes = votes.reduce(
        (sum: number, vote: ResultRow) => sum + Number(vote.vote_count ?? 0),
        0
      );

      return {
        totalVotes,
        results: votes.map((vote: ResultRow) => {
          const count = Number(vote.vote_count ?? 0);

          return {
            id: vote.option_id,
            text:
              vote.label ??
              poll?.options.find((option: any) => option.id === vote.option_id)
                ?.label ??
              "",
            count,
            percentage: totalVotes === 0 ? 0 : (count / totalVotes) * 100,
          };
        }),
      };
    }

    const totalVotes = votes?.length ?? 0;

    const results =
      poll?.options.map((option:any) => {
        const count =
          votes?.filter((vote:any) => vote.option_id === option.id).length ?? 0;

        return {
          id: option.id,
          text: option.label,
          count,
          percentage:
            totalVotes === 0 ? 0 : (count / totalVotes) * 100,
        };
      }) ?? [];

    return {
      totalVotes,
      results,
    };
  }, [poll, votes]);
}
