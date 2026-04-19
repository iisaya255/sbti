-- 001_initial_schema.sql

-- Status enum for quizzes
create type quiz_status as enum ('draft', 'published');

-- Profiles (linked to auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  nickname text,
  avatar_url text
);

-- Quizzes
create table quizzes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles on delete cascade,
  slug text unique not null,
  title text not null,
  description text,
  og_image text,
  status quiz_status not null default 'draft',
  created_at timestamptz not null default now(),
  published_at timestamptz
);

-- Dimensions
create table dimensions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes on delete cascade,
  code text not null,
  name text not null,
  sort_order int not null default 0
);

-- Questions
create table questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes on delete cascade,
  dimension_id uuid not null references dimensions on delete cascade,
  text text not null,
  sort_order int not null default 0
);

-- Options
create table options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions on delete cascade,
  text text not null,
  score int not null default 0
);

-- Personality types
create table personality_types (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes on delete cascade,
  code text not null,
  name text not null,
  description text,
  image_url text,
  dim_pattern jsonb not null default '{}'
);

-- Submissions
create table submissions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes on delete cascade,
  result_type uuid references personality_types on delete set null,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_quizzes_author on quizzes (author_id);
create index idx_quizzes_slug on quizzes (slug);
create index idx_dimensions_quiz on dimensions (quiz_id);
create index idx_questions_quiz on questions (quiz_id);
create index idx_options_question on options (question_id);
create index idx_personality_types_quiz on personality_types (quiz_id);
create index idx_submissions_quiz on submissions (quiz_id);

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table quizzes enable row level security;
alter table dimensions enable row level security;
alter table questions enable row level security;
alter table options enable row level security;
alter table personality_types enable row level security;
alter table submissions enable row level security;

-- Profiles: users can read any profile, update only their own
create policy "Profiles are viewable by everyone"
  on profiles for select using (true);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Quizzes: published quizzes are public, authors can CRUD their own
create policy "Published quizzes are viewable by everyone"
  on quizzes for select using (status = 'published' or auth.uid() = author_id);
create policy "Authors can insert quizzes"
  on quizzes for insert with check (auth.uid() = author_id);
create policy "Authors can update own quizzes"
  on quizzes for update using (auth.uid() = author_id);
create policy "Authors can delete own quizzes"
  on quizzes for delete using (auth.uid() = author_id);

-- Helper: check if user owns the quiz
create or replace function is_quiz_owner(qid uuid) returns boolean as $$
  select exists (select 1 from quizzes where id = qid and author_id = auth.uid());
$$ language sql security definer stable;

-- Dimensions: readable if quiz is visible, writable by quiz owner
create policy "Dimensions readable with quiz"
  on dimensions for select using (
    exists (select 1 from quizzes where id = quiz_id and (status = 'published' or author_id = auth.uid()))
  );
create policy "Quiz owner can insert dimensions"
  on dimensions for insert with check (is_quiz_owner(quiz_id));
create policy "Quiz owner can update dimensions"
  on dimensions for update using (is_quiz_owner(quiz_id));
create policy "Quiz owner can delete dimensions"
  on dimensions for delete using (is_quiz_owner(quiz_id));

-- Questions
create policy "Questions readable with quiz"
  on questions for select using (
    exists (select 1 from quizzes where id = quiz_id and (status = 'published' or author_id = auth.uid()))
  );
create policy "Quiz owner can insert questions"
  on questions for insert with check (is_quiz_owner(quiz_id));
create policy "Quiz owner can update questions"
  on questions for update using (is_quiz_owner(quiz_id));
create policy "Quiz owner can delete questions"
  on questions for delete using (is_quiz_owner(quiz_id));

-- Options
create policy "Options readable with quiz"
  on options for select using (
    exists (
      select 1 from questions q
      join quizzes qz on qz.id = q.quiz_id
      where q.id = question_id and (qz.status = 'published' or qz.author_id = auth.uid())
    )
  );
create policy "Quiz owner can insert options"
  on options for insert with check (
    exists (select 1 from questions q where q.id = question_id and is_quiz_owner(q.quiz_id))
  );
create policy "Quiz owner can update options"
  on options for update using (
    exists (select 1 from questions q where q.id = question_id and is_quiz_owner(q.quiz_id))
  );
create policy "Quiz owner can delete options"
  on options for delete using (
    exists (select 1 from questions q where q.id = question_id and is_quiz_owner(q.quiz_id))
  );

-- Personality types
create policy "Personality types readable with quiz"
  on personality_types for select using (
    exists (select 1 from quizzes where id = quiz_id and (status = 'published' or author_id = auth.uid()))
  );
create policy "Quiz owner can insert personality types"
  on personality_types for insert with check (is_quiz_owner(quiz_id));
create policy "Quiz owner can update personality types"
  on personality_types for update using (is_quiz_owner(quiz_id));
create policy "Quiz owner can delete personality types"
  on personality_types for delete using (is_quiz_owner(quiz_id));

-- Submissions: anyone can insert, readable by quiz owner
create policy "Anyone can submit"
  on submissions for insert with check (true);
create policy "Quiz owner can read submissions"
  on submissions for select using (is_quiz_owner(quiz_id));

-- Auto-create profile on signup
create or replace function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, nickname, avatar_url)
  values (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
