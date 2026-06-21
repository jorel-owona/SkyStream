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
    display_name TEXT DEFAULT NULL,         -- Nom d'affichage de l'auteur au moment de la publication
    photo_url TEXT DEFAULT NULL,            -- Photo de profil de l'auteur au moment de la publication
    views_count INTEGER DEFAULT 0,          -- Compteur de vues
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
    display_name TEXT DEFAULT NULL,         -- Nom de l'auteur
    photo_url TEXT DEFAULT NULL,            -- Photo de l'auteur
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index pour accélérer la recherche des stories éphémères de moins de 24h
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at DESC);

-- ====================================================================
-- 3. Table des Abonnements (Follows)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id TEXT NOT NULL,              -- UID Firebase de celui qui s'abonne
    following_id TEXT NOT NULL,             -- UID Firebase de celui qui est suivi
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(follower_id, following_id)       -- Empêche les doublons d'abonnements
);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

-- ====================================================================
-- 4. Table des Notifications
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id TEXT NOT NULL,             -- UID Firebase du destinataire
    sender_id TEXT NOT NULL,               -- UID Firebase de l'expéditeur
    sender_name TEXT DEFAULT NULL,         -- Nom d'affichage de l'expéditeur
    sender_avatar TEXT DEFAULT NULL,       -- Photo de l'expéditeur
    type TEXT NOT NULL,                    -- 'follow' | 'like' | 'comment'
    video_id TEXT DEFAULT NULL,            -- ID de la vidéo concernée (si applicable)
    message TEXT DEFAULT NULL,             -- Message optionnel
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ====================================================================
-- 5. Table des Messages Directs
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id TEXT NOT NULL,               -- UID Firebase de l'expéditeur
    recipient_id TEXT NOT NULL,            -- UID Firebase du destinataire
    text TEXT NOT NULL,                    -- Contenu du message
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- ====================================================================
-- 6. Table des Commentaires
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id TEXT NOT NULL,                -- ID de la vidéo commentée
    user_id TEXT NOT NULL,                 -- UID Firebase de l'auteur du commentaire
    display_name TEXT DEFAULT NULL,        -- Nom d'affichage de l'auteur
    photo_url TEXT DEFAULT NULL,           -- Photo de profil de l'auteur
    text TEXT NOT NULL,                    -- Contenu du commentaire
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_video_id ON public.comments(video_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

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
ALTER TABLE public.follows DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;

-- OPTION B (Plus sécurisée, si vous préférez activer RLS) :
-- Activez RLS et exécutez les politiques ci-dessous pour permettre l'insertion
-- et la lecture publique (anonyme).
/*
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

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

-- Politiques pour les autres tables
CREATE POLICY "Accès public follows" ON public.follows FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Accès public notifications" ON public.notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Accès public messages" ON public.messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Accès public comments" ON public.comments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
*/
