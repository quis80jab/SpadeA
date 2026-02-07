-- ============================================================
-- Ace Attorney AI Courtroom — Database Schema
-- Run this in Supabase SQL Editor after creating your project
-- ============================================================

-- ─── Profiles table ───
-- Auto-populated when a user signs up via trigger below

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  arguments_public_by_default BOOLEAN NOT NULL DEFAULT true,
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add unique constraint on display_name so usernames aren't reissued
CREATE UNIQUE INDEX idx_profiles_display_name ON public.profiles(display_name);

-- ─── Arguments table ───
-- Stores completed game sessions

CREATE TABLE public.arguments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  case_data JSONB NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  outcome TEXT NOT NULL CHECK (outcome IN ('won', 'lost')),
  final_health JSONB NOT NULL,
  exchange_count INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  starred BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_arguments_user_id ON public.arguments(user_id);
CREATE INDEX idx_arguments_is_public ON public.arguments(is_public);
CREATE INDEX idx_arguments_created_at ON public.arguments(created_at DESC);

-- ─── Leaderboard view ───

CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  p.id,
  p.display_name,
  p.wins,
  p.losses,
  p.total_score,
  CASE WHEN (p.wins + p.losses) > 0
    THEN ROUND((p.wins::numeric / (p.wins + p.losses)::numeric) * 100, 1)
    ELSE 0
  END AS win_rate,
  RANK() OVER (ORDER BY p.total_score DESC) AS rank
FROM public.profiles p
WHERE (p.wins + p.losses) > 0
ORDER BY p.total_score DESC;

-- ─── Auto-create profile on signup ───

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1),
      'Player'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Auto-update updated_at ───

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── Row Level Security ───

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arguments ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only owner can update
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Arguments: owner has full access, anyone can read public arguments
CREATE POLICY "Users can manage own arguments"
  ON public.arguments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public arguments are viewable by everyone"
  ON public.arguments FOR SELECT
  USING (is_public = true);

-- Grant access to the leaderboard view
GRANT SELECT ON public.leaderboard TO anon, authenticated;
