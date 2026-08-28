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
            if (isMissingCastVoteRpc(error)) {
                return voteWithDirectInsert({pollId, optionId, voterId});
            }

            throw error;
        }
        return data;


}

async function voteWithDirectInsert({pollId,optionId,voterId}:VoteData){
        const {data,error} = await supabase
            .from("votes")
            .insert({
                poll_id: pollId,
                option_id: optionId,
                voter_token: voterId
            })
            .select()
            .single();

        if(error){
            throw error;
        }

        return data;
}

function isMissingCastVoteRpc(error: { code?: string; message?: string }) {
    return (
        error.code === "PGRST202" ||
        error.message?.toLowerCase().includes("cast_vote") === true
    );
}
export function useVote(){
    return useMutation({
        mutationFn: vote
    });
} 
