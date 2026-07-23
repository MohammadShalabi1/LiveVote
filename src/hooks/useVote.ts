import { useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

type VoteData ={
    pollId: string;
    optionId: string;
    voterToken: string;
}
async function vote({pollId,optionId,voterToken}:VoteData){
    const { data: poll } = await supabase
        .from("polls")
        .select("is_closed")
        .eq("id", pollId)
        .single();

        if (poll?.is_closed) {
        throw new Error("Poll is closed");
        }
        const {data,error} = await supabase.from("votes").insert({
            poll_id: pollId,
            option_id: optionId,
            voter_token: voterToken
        }).select().single();


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