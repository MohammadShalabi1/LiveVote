import { useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

type VoteData ={
    pollId: string;
    optionId: string;
    voterId: string;
}
async function vote({pollId,optionId,voterId}:VoteData){
        const {data,error} = await supabase.rpc("cast_vote", {
            p_poll_id: pollId,
            p_option_id: optionId,
            p_voter_id: voterId
        });


        if(error){
            throw error;
        }
        return data;


}
export function useVote(){
    return useMutation({
        mutationFn: vote
    });
} 
