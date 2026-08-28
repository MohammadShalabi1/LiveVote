-- Task 6: add indexes for common LiveVote read, write, and realtime paths.
-- The unique Task 2 constraint on (poll_id, voter_token) already creates
-- its own supporting index, so this migration does not duplicate it.

create index if not exists options_poll_id_position_idx
on public.options (poll_id, position);

create index if not exists votes_poll_id_idx
on public.votes (poll_id);

create index if not exists votes_option_id_idx
on public.votes (option_id);

create index if not exists polls_creator_token_idx
on public.polls (creator_token);

create index if not exists polls_created_at_idx
on public.polls (created_at);
