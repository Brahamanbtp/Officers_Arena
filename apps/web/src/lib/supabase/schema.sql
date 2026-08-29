-- Enable UUID and Vector extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    target_exam TEXT NOT NULL CHECK (target_exam IN ('UPSC', 'CDS')),
    target_year INT NOT NULL DEFAULT 2026,
    daily_goal_hours INT NOT NULL DEFAULT 4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Policies for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Topic Mastery Table (Hybrid Sync Target)
CREATE TABLE IF NOT EXISTS public.user_topic_mastery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_name TEXT NOT NULL,
    mastery_score DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, topic_name)
);

ALTER TABLE public.user_topic_mastery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own topic mastery"
    ON public.user_topic_mastery FOR ALL USING (auth.uid() = user_id);

-- 3. Topics Table (Hierarchical Knowledge Graph)
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    parent_topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Questions Table (IRT 3PL & Content)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    exam_type TEXT NOT NULL CHECK (exam_type IN ('UPSC', 'CDS')),
    difficulty_level DOUBLE PRECISION NOT NULL DEFAULT 0.5 CHECK (difficulty_level >= 0.0 AND difficulty_level <= 1.0),
    content TEXT NOT NULL,
    explanation TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Options Table
CREATE TABLE IF NOT EXISTS public.options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE
);

-- 6. User Attempts Table
CREATE TABLE IF NOT EXISTS public.user_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    chosen_option_id UUID REFERENCES public.options(id) ON DELETE SET NULL,
    is_correct BOOLEAN NOT NULL,
    response_time_ms INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.user_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own attempts"
    ON public.user_attempts FOR ALL USING (auth.uid() = user_id);

-- 7. Knowledge Chunks Table (pgvector Support for GraphRAG Grounding)
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    embedding vector(1536),
    source_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- HNSW Vector Index for <20ms Similarity Search
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_hnsw_idx 
    ON public.knowledge_chunks 
    USING hnsw (embedding vector_cosine_ops);

-- 8. State History Table (Growth Timeline & Cognitive Digital Twin Tracking)
CREATE TABLE IF NOT EXISTS public.state_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    theta DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    topic_name TEXT NOT NULL,
    mastery_score DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.state_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own state history"
    ON public.state_history FOR ALL USING (auth.uid() = user_id);

-- 9. Admin Access Security Helper
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN user_id = '00000000-0000-0000-0000-000000000000'::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
