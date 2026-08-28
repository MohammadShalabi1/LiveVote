-- Task 3: cast a vote with one atomic database operation.
-- Direct vote inserts are replaced by this RPC so poll/option checks happen together.

revoke insert on table public.votes from anon, authenticated;

drop policy if exists "visitors can vote on open polls" on public.votes;

create or replace function public.cast_vote(
  p_poll_id uuid,
  p_option_id uuid,
  p_voter_id text
)
returns public.votes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vote public.votes;
begin
  if p_voter_id is null or length(trim(p_voter_id)) = 0 then
    raise exception 'Voter ID is required' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.polls
    where id = p_poll_id
      and coalesce(is_closed, false) = false
  ) then
    raise exception 'Poll is closed or does not exist' using errcode = 'LV001';
  end if;

  if not exists (
    select 1
    from public.options
    where id = p_option_id
      and poll_id = p_poll_id
  ) then
    raise exception 'Option does not belong to this poll' using errcode = 'LV002';
  end if;

  insert into public.votes (poll_id, option_id, voter_token)
  values (p_poll_id, p_option_id, trim(p_voter_id))
  returning * into v_vote;

  return v_vote;
end;
$$;

revoke all on function public.cast_vote(uuid, uuid, text) from public;
grant execute on function public.cast_vote(uuid, uuid, text) to anon, authenticated;
