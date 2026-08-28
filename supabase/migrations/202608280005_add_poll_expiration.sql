-- Task 5: support poll expiration in addition to manual close.

alter table public.polls
  add column if not exists expires_at timestamptz null;

alter table public.polls
  drop constraint if exists polls_expires_at_future_or_null_check,
  add constraint polls_expires_at_future_or_null_check
    check (expires_at is null or expires_at > created_at);

create or replace function public.create_poll(
  p_question text,
  p_options jsonb,
  p_creator_token text,
  p_expires_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_poll_id uuid;
begin
  if p_question is null or length(trim(p_question)) < 3 or length(trim(p_question)) > 120 then
    raise exception 'Question must be between 3 and 120 characters' using errcode = '22023';
  end if;

  if p_creator_token is null or length(trim(p_creator_token)) = 0 then
    raise exception 'Creator token is required' using errcode = '22023';
  end if;

  if p_expires_at is not null and p_expires_at <= now() then
    raise exception 'Expiration must be in the future' using errcode = '22023';
  end if;

  if p_options is null
    or jsonb_typeof(p_options) <> 'array'
    or jsonb_array_length(p_options) < 2
    or jsonb_array_length(p_options) > 10 then
    raise exception 'Polls must have between 2 and 10 options' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_options) as option_rows(option_item)
    where length(trim(coalesce(option_item->>'text', ''))) not between 1 and 80
  ) then
    raise exception 'Each option must be between 1 and 80 characters' using errcode = '22023';
  end if;

  if exists (
    select lower(trim(option_item->>'text'))
    from jsonb_array_elements(p_options) as option_rows(option_item)
    group by lower(trim(option_item->>'text'))
    having count(*) > 1
  ) then
    raise exception 'Options must be unique' using errcode = '22023';
  end if;

  insert into public.polls (question, creator_token, expires_at)
  values (trim(p_question), trim(p_creator_token), p_expires_at)
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
      and (expires_at is null or expires_at > now())
  ) then
    raise exception 'Poll is closed, expired, or does not exist' using errcode = 'LV001';
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

revoke all on function public.create_poll(text, jsonb, text, timestamptz) from public;
grant execute on function public.create_poll(text, jsonb, text, timestamptz) to anon, authenticated;
