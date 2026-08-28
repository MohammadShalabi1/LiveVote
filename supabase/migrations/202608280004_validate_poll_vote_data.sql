-- Task 4: validate poll and vote data at the database boundary.
-- Existing invalid rows must be cleaned up before applying these constraints.

alter table public.polls
  add column if not exists created_at timestamptz not null default now();

alter table public.options
  add column if not exists created_at timestamptz not null default now();

alter table public.votes
  add column if not exists created_at timestamptz not null default now();

alter table public.polls
  alter column question set not null,
  alter column creator_token set not null;

alter table public.options
  alter column poll_id set not null,
  alter column label set not null,
  alter column position set not null;

alter table public.votes
  alter column poll_id set not null,
  alter column option_id set not null,
  alter column voter_token set not null;

alter table public.polls
  drop constraint if exists polls_question_length_check,
  add constraint polls_question_length_check
    check (length(trim(question)) between 3 and 120);

alter table public.options
  drop constraint if exists options_label_length_check,
  add constraint options_label_length_check
    check (length(trim(label)) between 1 and 80);

alter table public.polls
  drop constraint if exists polls_creator_token_required_check,
  add constraint polls_creator_token_required_check
    check (length(trim(creator_token)) > 0);

alter table public.votes
  drop constraint if exists votes_voter_token_required_check,
  add constraint votes_voter_token_required_check
    check (length(trim(voter_token)) > 0);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'options_poll_id_fkey'
  ) then
    alter table public.options
      add constraint options_poll_id_fkey
      foreign key (poll_id) references public.polls(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'votes_poll_id_fkey'
  ) then
    alter table public.votes
      add constraint votes_poll_id_fkey
      foreign key (poll_id) references public.polls(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'votes_option_id_fkey'
  ) then
    alter table public.votes
      add constraint votes_option_id_fkey
      foreign key (option_id) references public.options(id) on delete cascade;
  end if;
end $$;

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
  if p_question is null or length(trim(p_question)) < 3 or length(trim(p_question)) > 120 then
    raise exception 'Question must be between 3 and 120 characters' using errcode = '22023';
  end if;

  if p_creator_token is null or length(trim(p_creator_token)) = 0 then
    raise exception 'Creator token is required' using errcode = '22023';
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
