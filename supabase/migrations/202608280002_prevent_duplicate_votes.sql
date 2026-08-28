-- Task 2: prevent normal duplicate anonymous votes at the database level.
-- Existing duplicate rows must be cleaned up before applying this migration.

alter table public.votes
  alter column poll_id set not null,
  alter column option_id set not null,
  alter column voter_token set not null;

alter table public.votes
  add constraint votes_poll_id_voter_token_key unique (poll_id, voter_token);
