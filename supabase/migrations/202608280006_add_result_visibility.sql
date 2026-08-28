-- Task 5.1: let creators control when voters can see results.
-- Vote rows are no longer directly readable by anonymous clients; result
-- visibility is enforced through aggregate RPCs.

alter table public.polls
  add column if not exists results_visibility text not null default 'always';

alter table public.polls
  drop constraint if exists polls_results_visibility_check,
  add constraint polls_results_visibility_check
    check (results_visibility in ('always', 'after_vote', 'after_close'));

revoke select on table public.votes from anon, authenticated;

drop policy if exists "votes are publicly readable" on public.votes;

create or replace function public.create_poll(
  p_question text,
  p_options jsonb,
  p_creator_token text,
  p_expires_at timestamptz default null,
  p_results_visibility text default 'always'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_poll_id uuid;
  v_results_visibility text := coalesce(p_results_visibility, 'always');
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

  if v_results_visibility not in ('always', 'after_vote', 'after_close') then
    raise exception 'Results visibility is invalid' using errcode = '22023';
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

  insert into public.polls (question, creator_token, expires_at, results_visibility)
  values (trim(p_question), trim(p_creator_token), p_expires_at, v_results_visibility)
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

create or replace function public.has_voted(
  p_poll_id uuid,
  p_voter_id text
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.votes
    where poll_id = p_poll_id
      and voter_token = trim(p_voter_id)
  );
$$;

create or replace function public.can_view_poll_results(
  p_poll_id uuid,
  p_voter_id text default null,
  p_creator_token text default null
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.polls
    where id = p_poll_id
      and (
        results_visibility = 'always'
        or creator_token = trim(coalesce(p_creator_token, ''))
        or (
          results_visibility = 'after_vote'
          and exists (
            select 1
            from public.votes
            where votes.poll_id = polls.id
              and votes.voter_token = trim(coalesce(p_voter_id, ''))
          )
        )
        or (
          results_visibility = 'after_close'
          and (
            coalesce(is_closed, false) = true
            or (expires_at is not null and expires_at <= now())
          )
        )
      )
  );
$$;

create or replace function public.get_poll_results(
  p_poll_id uuid,
  p_voter_id text default null,
  p_creator_token text default null
)
returns table (
  option_id uuid,
  label text,
  position integer,
  vote_count bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.can_view_poll_results(p_poll_id, p_voter_id, p_creator_token) then
    raise exception 'Results are hidden for this poll' using errcode = 'LV003';
  end if;

  return query
  select
    options.id,
    options.label,
    options.position,
    count(votes.id) as vote_count
  from public.options
  left join public.votes
    on votes.option_id = options.id
    and votes.poll_id = options.poll_id
  where options.poll_id = p_poll_id
  group by options.id, options.label, options.position
  order by options.position asc, options.label asc;
end;
$$;

revoke all on function public.create_poll(text, jsonb, text, timestamptz, text) from public;
revoke all on function public.has_voted(uuid, text) from public;
revoke all on function public.can_view_poll_results(uuid, text, text) from public;
revoke all on function public.get_poll_results(uuid, text, text) from public;

grant execute on function public.create_poll(text, jsonb, text, timestamptz, text) to anon, authenticated;
grant execute on function public.has_voted(uuid, text) to anon, authenticated;
grant execute on function public.can_view_poll_results(uuid, text, text) to anon, authenticated;
grant execute on function public.get_poll_results(uuid, text, text) to anon, authenticated;
