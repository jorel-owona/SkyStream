-- ====================================================================
-- SCHEMA DE BASE DE DONNÉES SUPABASE POUR STREAMSKY
-- Projet : React Native + Firebase Auth + Supabase (Database) + Cloudinary
-- ====================================================================

-- 1. Table des Vidéos
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,                  -- UID unique provenant de Firebase Auth
    title TEXT DEFAULT 'Sans titre',        -- Titre ou légende de la vidéo
    cloudinary_url TEXT NOT NULL,           -- URL publique Cloudinary
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index pour accélérer le filtrage par utilisateur et le tri temporel
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON public.videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON public.videos(created_at DESC);

-- 2. Table des Stories (Éphémères)
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,                  -- UID unique provenant de Firebase Auth
    title TEXT DEFAULT '',                  -- Légende de la story
    cloudinary_url TEXT NOT NULL,           -- URL publique Cloudinary (image ou vidéo)
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index pour accélérer la recherche des stories éphémères de moins de 24h
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at DESC);

-- ====================================================================
-- GESTION DE LA SECURITE DE L'ACCES (RLS / POLICIES)
-- ====================================================================
-- Comme l'authentification est gérée par Firebase Auth et non par Supabase Auth,
-- Supabase considérera ces requêtes clients comme "anonymes" (sans session Supabase).
-- Pour un projet en développement ou un rendu rapide, vous pouvez désactiver RLS
-- ou créer des politiques permettant l'accès anonyme.

-- OPTION A (Recommandée pour le rendu de demain, simple et rapide) :
-- Désactiver la sécurité RLS pour que l'application puisse lire/écrire directement.
ALTER TABLE public.videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories DISABLE ROW LEVEL SECURITY;

-- OPTION B (Plus sécurisée, si vous préférez activer RLS) :
-- Activez RLS et exécutez les politiques ci-dessous pour permettre l'insertion
-- et la lecture publique (anonyme).
/*
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table VIDEOS
CREATE POLICY "Lecture publique des vidéos" ON public.videos
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Insertion publique des vidéos" ON public.videos
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Politiques pour la table STORIES
CREATE POLICY "Lecture publique des stories" ON public.stories
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Insertion publique des stories" ON public.stories
    FOR INSERT TO anon, authenticated WITH CHECK (true);
*/
