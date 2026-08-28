-- Task 1: make Supabase RLS/grants the authorization boundary.
-- The frontend uses the public anon key, so direct table writes must stay narrow.

alter table public.polls enable row level security;
alter table public.options enable row level security;
alter table public.votes enable row level security;

revoke all on table public.polls from anon, authenticated;
revoke all on table public.options from anon, authenticated;
revoke all on table public.votes from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on table public.polls to anon, authenticated;
grant select on table public.options to anon, authenticated;
grant select on table public.votes to anon, authenticated;
grant insert on table public.votes to anon, authenticated;

drop policy if exists "polls are publicly readable" on public.polls;
drop policy if exists "options are publicly readable" on public.options;
drop policy if exists "votes are publicly readable" on public.votes;
drop policy if exists "visitors can vote on open polls" on public.votes;

create policy "polls are publicly readable"
on public.polls
for select
to anon, authenticated
using (true);

create policy "options are publicly readable"
on public.options
for select
to anon, authenticated
using (true);

create policy "votes are publicly readable"
on public.votes
for select
to anon, authenticated
using (true);

-- Anonymous voters may create a vote only for an option that belongs to
-- the same open poll. Vote updates/deletes intentionally have no policy.
create policy "visitors can vote on open polls"
on public.votes
for insert
to anon, authenticated
with check (
  voter_token is not null
  and length(trim(voter_token)) > 0
  and exists (
    select 1
    from public.polls
    where polls.id = votes.poll_id
      and coalesce(polls.is_closed, false) = false
  )
  and exists (
    select 1
    from public.options
    where options.id = votes.option_id
      and options.poll_id = votes.poll_id
  )
);

create or replace function public.create_poll(
  p_question text,
  p_options jsonb,
  p_creator_token text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_poll_id uuid;
begin
  if p_question is null or length(trim(p_question)) = 0 then
    raise exception 'Question is required' using errcode = '22023';
  end if;

  if p_creator_token is null or length(trim(p_creator_token)) = 0 then
    raise exception 'Creator token is required' using errcode = '22023';
  end if;

  if p_options is null or jsonb_typeof(p_options) <> 'array' or jsonb_array_length(p_options) < 2 then
    raise exception 'At least two options are required' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_options) as option_rows(option_item)
    where length(trim(coalesce(option_item->>'text', ''))) = 0
  ) then
    raise exception 'Options cannot be blank' using errcode = '22023';
  end if;

  insert into public.polls (question, creator_token)
  values (trim(p_question), trim(p_creator_token))
  returning id into v_poll_id;

  insert into public.options (poll_id, label, position)
  select
    v_poll_id,
    trim(option_item->>'text'),
    option_index - 1
  from jsonb_array_elements(p_options) with ordinality as option_rows(option_item, option_index);

  return v_poll_id;
end;
$$;

create or replace function public.close_poll(
  p_poll_id uuid,
  p_creator_token text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.polls
  set is_closed = true
  where id = p_poll_id
    and creator_token = trim(p_creator_token);

  if not found then
    raise exception 'Poll not found or creator token is invalid' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.delete_poll(
  p_poll_id uuid,
  p_creator_token text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.polls
    where id = p_poll_id
      and creator_token = trim(p_creator_token)
  ) then
    raise exception 'Poll not found or creator token is invalid' using errcode = '42501';
  end if;

  delete from public.votes
  where poll_id = p_poll_id;

  delete from public.options
  where poll_id = p_poll_id;

  delete from public.polls
  where id = p_poll_id
    and creator_token = trim(p_creator_token);
end;
$$;

revoke all on function public.create_poll(text, jsonb, text) from public;
revoke all on function public.close_poll(uuid, text) from public;
revoke all on function public.delete_poll(uuid, text) from public;

grant execute on function public.create_poll(text, jsonb, text) to anon, authenticated;
grant execute on function public.close_poll(uuid, text) to anon, authenticated;
grant execute on function public.delete_poll(uuid, text) to anon, authenticated;
