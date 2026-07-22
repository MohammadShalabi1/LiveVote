import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

async function fetchVoteResult(pollId: string) {
    const{data,error} = await supabase.from("votes").select("option_id").eq("poll_id",pollId);
    if(error){
        throw error;
    }
    return data;
}

export function useVoteResult(pollId: string) {
    return useQuery({
        queryKey: ["voteResult",pollId],
        queryFn: () => fetchVoteResult(pollId),
        enabled: !!pollId,
    });
}