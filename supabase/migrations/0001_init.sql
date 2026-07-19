-- ════════════════════════════════════════════════════════════════
-- timshel — production schema  (Supabase / Postgres 15)
-- Auth: Supabase Auth (LinkedIn OIDC + Google + email magic-link)
-- ════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ─── enums ──────────────────────────────────────────────────────
do $$ begin
  create type opp_type as enum ('Fellowship','Hackathon','Grant','Internship','Competition','Conference','Workshop','Scholarship','Job');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_status as enum ('saved','drafting','ready','submitted','interview','accepted','rejected','withdrawn');
exception when duplicate_object then null; end $$;

do $$ begin
  create type plan_tier as enum ('free','plus','pro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sub_status as enum ('active','trialing','past_due','canceled','expired');
exception when duplicate_object then null; end $$;

-- ─── profiles (1:1 auth.users) ──────────────────────────────────
-- Auto-populated from LinkedIn/Google OAuth metadata via trigger below.
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  full_name     text,
  avatar_url    text,
  -- LinkedIn-sourced (speeds up registration)
  headline      text,                     -- LinkedIn headline
  linkedin_url  text,
  linkedin_id   text,
  provider      text,                     -- linkedin_oidc | google | email
  -- onboarding (LinkedIn-style progressive)
  role          text,                     -- school | ug | pg | phd | postdoc | professional
  institution   text,
  field_of_study text,
  graduation_year int,
  looking_for   text[]  default '{}',     -- ['Fellowships','Hackathons',...]
  domains       text[]  default '{}',     -- ['AI/ML','Engineering',...]
  geo_pref      text,                     -- india | abroad | remote | any
  goal          text,                     -- fund | experience | network | relocate
  skills        text[]  default '{}',
  onboarded     boolean default false,
  onboarding_step int   default 0,
  -- engagement
  plan          plan_tier default 'free',
  whatsapp      text,
  whatsapp_opt_in boolean default false,
  streak_count  int default 0,
  streak_last   date,
  referral_code text unique default substr(md5(random()::text),1,8),
  referred_by   text,
  xp            int default 0,            -- gamification points
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── sources ────────────────────────────────────────────────────
create table if not exists sources (
  id           serial primary key,
  slug         text unique not null,
  name         text not null,
  url          text,
  category     text,
  enabled      boolean default true,
  last_crawled timestamptz,
  last_success timestamptz,
  last_count   int default 0,
  status       text default 'pending',
  created_at   timestamptz default now()
);

-- ─── opportunities ──────────────────────────────────────────────
create table if not exists opportunities (
  id            bigserial primary key,
  external_id   text unique,
  source_slug   text,
  title         text not null,
  org           text,
  type          opp_type,
  domains       text[] default '{}',
  description   text,
  url           text,
  apply_url     text,
  location      text,
  geo           text,                     -- india | abroad | remote
  prize         text,                     -- stipend / award text
  duration      text,
  deadline      date,
  eligibility   text,
  roles         text[] default '{}',      -- which role levels can apply
  image_url     text,
  quality_score real default 0.5,
  applied_count int default 0,            -- social proof
  view_count    int default 0,
  is_featured   boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists idx_opp_type    on opportunities(type);
create index if not exists idx_opp_deadline on opportunities(deadline);
create index if not exists idx_opp_geo      on opportunities(geo);
create index if not exists idx_opp_trgm     on opportunities using gin (title gin_trgm_ops);

-- ─── event detail (rich content: images, reviews, past editions) ─
create table if not exists event_media (
  id          bigserial primary key,
  opp_id      bigint references opportunities(id) on delete cascade,
  kind        text,                       -- image | video | logo
  url         text not null,
  caption     text,
  sort        int default 0
);
create table if not exists event_reviews (
  id          bigserial primary key,
  opp_id      bigint references opportunities(id) on delete cascade,
  author_id   uuid references profiles(id) on delete set null,
  author_name text,
  rating      int check (rating between 1 and 5),
  year        int,                        -- which edition they attended
  body        text,
  helpful     int default 0,
  created_at  timestamptz default now()
);
create table if not exists event_editions (
  id          bigserial primary key,
  opp_id      bigint references opportunities(id) on delete cascade,
  year        int,
  summary     text,
  winners     text,
  stats       jsonb,                      -- {applicants, selected, prize_pool}
  recap_url   text
);

-- ─── saves (with intent) ────────────────────────────────────────
create table if not exists saves (
  user_id    uuid references profiles(id) on delete cascade,
  opp_id     bigint references opportunities(id) on delete cascade,
  intent     text default 'browsing',     -- applying | browsing
  created_at timestamptz default now(),
  primary key (user_id, opp_id)
);

-- ─── applications (status tracking) ─────────────────────────────
create table if not exists applications (
  id          bigserial primary key,
  user_id     uuid references profiles(id) on delete cascade,
  opp_id      bigint references opportunities(id) on delete cascade,
  status      app_status default 'drafting',
  draft       jsonb default '{}',          -- agent-built answers: {sop, fields}
  submitted_at timestamptz,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (user_id, opp_id)
);

-- ─── apply-through-chat agent ───────────────────────────────────
create table if not exists agent_threads (
  id          bigserial primary key,
  user_id     uuid references profiles(id) on delete cascade,
  opp_id      bigint references opportunities(id) on delete set null,
  title       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create table if not exists agent_messages (
  id          bigserial primary key,
  thread_id   bigint references agent_threads(id) on delete cascade,
  role        text not null,               -- user | assistant | system | tool
  content     text,
  meta        jsonb,                       -- tool calls / citations / draft refs
  created_at  timestamptz default now()
);

-- ─── subscriptions (Razorpay) ───────────────────────────────────
create table if not exists subscriptions (
  id             bigserial primary key,
  user_id        uuid references profiles(id) on delete cascade,
  tier           plan_tier not null,
  status         sub_status default 'active',
  rzp_sub_id     text,                     -- razorpay subscription id
  rzp_plan_id    text,
  rzp_customer_id text,
  current_start  timestamptz,
  current_end    timestamptz,
  created_at     timestamptz default now()
);

-- ─── referrals ──────────────────────────────────────────────────
create table if not exists referrals (
  id          bigserial primary key,
  referrer_id uuid references profiles(id) on delete cascade,
  referred_id uuid references profiles(id) on delete cascade,
  reward_granted boolean default false,
  created_at  timestamptz default now(),
  unique (referred_id)
);

-- ─── notifications / reminder queue (WhatsApp + push + email) ────
create table if not exists notifications (
  id          bigserial primary key,
  user_id     uuid references profiles(id) on delete cascade,
  opp_id      bigint references opportunities(id) on delete cascade,
  channel     text default 'push',         -- push | whatsapp | email
  fire_at     timestamptz not null,
  payload     jsonb,
  sent        boolean default false,
  created_at  timestamptz default now()
);
create index if not exists idx_notif_due on notifications(fire_at) where sent = false;

-- ════════════════════════════════════════════════════════════════
-- AUTH TRIGGER — auto-create profile + pull LinkedIn/Google data
-- LinkedIn OIDC puts: name, email, picture, (and we map headline)
-- Google puts: name, email, picture
-- ════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, provider, linkedin_url, headline)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    coalesce(new.raw_app_meta_data->>'provider', 'email'),
    new.raw_user_meta_data->>'profile',            -- LinkedIn profile url if present
    new.raw_user_meta_data->>'headline'
  )
  on conflict (id) do update set
    email      = excluded.email,
    full_name  = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    provider   = excluded.provider;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists t_profiles_touch on profiles;
create trigger t_profiles_touch before update on profiles
  for each row execute function public.touch_updated_at();

-- streak bump (called from app or edge fn)
create or replace function public.bump_streak(uid uuid)
returns int language plpgsql security definer set search_path = public as $$
declare cur int; last_d date;
begin
  select streak_count, streak_last into cur, last_d from profiles where id = uid;
  if last_d = current_date then return cur; end if;
  if last_d = current_date - 1 then cur := coalesce(cur,0) + 1; else cur := 1; end if;
  update profiles set streak_count = cur, streak_last = current_date, xp = xp + 10 where id = uid;
  return cur;
end $$;

-- ════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════
alter table profiles       enable row level security;
alter table saves          enable row level security;
alter table applications   enable row level security;
alter table agent_threads  enable row level security;
alter table agent_messages enable row level security;
alter table subscriptions  enable row level security;
alter table referrals      enable row level security;
alter table notifications  enable row level security;
alter table event_reviews  enable row level security;

-- opportunities + event content are public-read
alter table opportunities  enable row level security;
alter table event_media    enable row level security;
alter table event_editions enable row level security;
alter table sources        enable row level security;

create policy "public read opps"     on opportunities  for select using (true);
create policy "public read media"    on event_media    for select using (true);
create policy "public read editions" on event_editions for select using (true);
create policy "public read reviews"  on event_reviews  for select using (true);
create policy "public read sources"  on sources        for select using (true);

create policy "own profile"      on profiles      for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own saves"        on saves         for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own apps"         on applications  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own threads"      on agent_threads for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own msgs"         on agent_messages for all using (exists (select 1 from agent_threads t where t.id = thread_id and t.user_id = auth.uid()));
create policy "own subs"         on subscriptions for select using (auth.uid() = user_id);
create policy "own notifs"       on notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "write reviews"    on event_reviews for insert with check (auth.uid() = author_id);
create policy "ref read"         on referrals     for select using (auth.uid() = referrer_id or auth.uid() = referred_id);
