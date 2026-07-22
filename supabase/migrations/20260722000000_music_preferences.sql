-- Per-user pairwise song preferences. Apply with `supabase db push` after
-- linking the project; this migration is intentionally not run by the app.

create table if not exists public.music_preference_comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  left_song_id integer not null references public.music(id) on delete cascade,
  right_song_id integer not null references public.music(id) on delete cascade,
  outcome smallint not null check (outcome in (-1, 0, 1)),
  created_at timestamptz not null default now(),
  check (left_song_id <> right_song_id)
);

create index if not exists music_preference_comparisons_user_created_idx
  on public.music_preference_comparisons (user_id, created_at desc);

create table if not exists public.music_preference_ratings (
  user_id uuid not null references auth.users(id) on delete cascade,
  song_id integer not null references public.music(id) on delete cascade,
  rating double precision not null default 1500,
  uncertainty double precision not null default 350,
  comparisons integer not null default 0 check (comparisons >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, song_id)
);

alter table public.music_preference_comparisons enable row level security;
alter table public.music_preference_ratings enable row level security;

-- Reads are account-scoped by RLS; writes happen only inside the RPC below.
revoke all on table public.music_preference_comparisons from anon;
revoke all on table public.music_preference_ratings from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.music_preference_comparisons from authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.music_preference_ratings from authenticated;
grant select on table public.music_preference_comparisons to authenticated;
grant select on table public.music_preference_ratings to authenticated;

drop policy if exists music_preference_comparisons_owner_select
  on public.music_preference_comparisons;
create policy music_preference_comparisons_owner_select
  on public.music_preference_comparisons for select
  using (user_id = auth.uid());

drop policy if exists music_preference_ratings_owner_select
  on public.music_preference_ratings;
create policy music_preference_ratings_owner_select
  on public.music_preference_ratings for select
  using (user_id = auth.uid());

create or replace function public.record_music_preference(
  p_left_song_id integer,
  p_right_song_id integer,
  p_outcome smallint
)
returns setof public.music_preference_ratings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_left integer := p_left_song_id;
  v_right integer := p_right_song_id;
  v_result smallint := p_outcome;
  v_left_rating public.music_preference_ratings;
  v_right_rating public.music_preference_ratings;
  v_expected double precision;
  v_score double precision;
  v_delta double precision;
  v_k_left double precision;
  v_k_right double precision;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_left_song_id is null or p_right_song_id is null
     or p_left_song_id = p_right_song_id
     or p_outcome not in (-1, 0, 1) then
    raise exception 'invalid preference input' using errcode = '22023';
  end if;
  if not exists (select 1 from public.music where id = p_left_song_id)
     or not exists (select 1 from public.music where id = p_right_song_id) then
    raise exception 'song not found' using errcode = '22023';
  end if;

  -- Store one canonical direction so A/B and B/A do not create duplicate edges.
  if v_left > v_right then
    v_left := p_right_song_id;
    v_right := p_left_song_id;
    v_result := -p_outcome;
  end if;

  insert into public.music_preference_ratings (user_id, song_id)
  values (v_user_id, v_left), (v_user_id, v_right)
  on conflict (user_id, song_id) do nothing;

  select * into v_left_rating
  from public.music_preference_ratings
  where user_id = v_user_id and song_id = v_left
  for update;
  select * into v_right_rating
  from public.music_preference_ratings
  where user_id = v_user_id and song_id = v_right
  for update;

  v_expected := 1 / (1 + power(10, (v_right_rating.rating - v_left_rating.rating) / 400));
  v_score := case when v_result = 1 then 1 when v_result = -1 then 0 else 0.5 end;
  v_k_left := greatest(12, least(48, 32 * (v_left_rating.uncertainty / 350)));
  v_k_right := greatest(12, least(48, 32 * (v_right_rating.uncertainty / 350)));
  v_delta := v_score - v_expected;

  update public.music_preference_ratings
  set rating = v_left_rating.rating + v_k_left * v_delta,
      uncertainty = greatest(45, v_left_rating.uncertainty * 0.93),
      comparisons = v_left_rating.comparisons + 1,
      updated_at = now()
  where user_id = v_user_id and song_id = v_left;
  update public.music_preference_ratings
  set rating = v_right_rating.rating - v_k_right * v_delta,
      uncertainty = greatest(45, v_right_rating.uncertainty * 0.93),
      comparisons = v_right_rating.comparisons + 1,
      updated_at = now()
  where user_id = v_user_id and song_id = v_right;

  insert into public.music_preference_comparisons
    (user_id, left_song_id, right_song_id, outcome)
  values (v_user_id, v_left, v_right, v_result);

  return query
    select * from public.music_preference_ratings
    where user_id = v_user_id and song_id in (v_left, v_right)
    order by song_id;
end;
$$;

revoke all on function public.record_music_preference(integer, integer, smallint)
  from public;
grant execute on function public.record_music_preference(integer, integer, smallint)
  to authenticated;
