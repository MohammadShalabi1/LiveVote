import { useMemo } from "react";

export function useDataChart(poll:any, votes:any) {
  return useMemo(() => {
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