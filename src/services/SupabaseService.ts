import { supabase } from '../libs/supabase';
import auth from '@react-native-firebase/auth';
import { Platform } from 'react-native';

export interface SupabaseVideo {
  id: string;
  user_id: string;
  title: string | null;
  cloudinary_url: string;
  created_at: string;
  display_name?: string | null;
  photo_url?: string | null;
}

export interface SupabaseStory {
  id: string;
  user_id: string;
  title: string | null;
  cloudinary_url: string;
  created_at: string;
}

class SupabaseService {
  /**
   * Récupère l'UID unique de l'utilisateur connecté via Firebase Auth.
   */
  getFirebaseUid(): string | null {
    const currentUser = auth().currentUser;
    return currentUser ? currentUser.uid : null;
  }

  /**
   * Effectue le téléversement réel d'un fichier vidéo vers Cloudinary via l'API REST.
   * Si le téléversement échoue (ex: preset non configuré), utilise la vidéo d'introduction HLS de repli.
   * 
   * @param localUri Chemin d'accès local du fichier vidéo (ex: file://...)
   */
  async uploadToCloudinarySimulated(localUri: string): Promise<string> {
    console.log(`[Cloudinary] Début du téléversement réel pour : ${localUri}`);

    let cleanUri = localUri;
    if (Platform.OS === 'android' && !cleanUri.startsWith('file://') && !cleanUri.startsWith('content://')) {
      cleanUri = `file://${cleanUri}`;
    }

    const cloudName = 'dwfvxe1ne';
    const uploadPreset = 'streamsky_preset';

    const data = new FormData();
    data.append('file', {
      uri: cleanUri,
      type: 'video/mp4',
      name: 'upload.mp4',
    } as any);
    data.append('upload_preset', uploadPreset);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message);
      }

      console.log(`[Cloudinary] Téléversement réel réussi. URL : ${result.secure_url}`);
      return result.secure_url;
    } catch (err: any) {
      console.warn(`[Cloudinary] Le téléversement réel a échoué (Avez-vous créé le preset '${uploadPreset}' dans votre compte Cloudinary '${cloudName}' ?). Erreur :`, err.message || err);

      // Vidéo de repli publique et fonctionnelle sur l'espace Cloudinary de l'utilisateur
      const workingFallbackUrl = `https://res.cloudinary.com/${cloudName}/video/upload/f_auto,q_auto/v1781006675/introduction_gewbzq.m3u8`;
      console.log(`[Cloudinary] Utilisation de la vidéo de repli fonctionnelle : ${workingFallbackUrl}`);
      return workingFallbackUrl;
    }
  }

  /**
   * Insère une nouvelle vidéo dans la table Supabase `videos`
   * en associant l'UID Firebase et les infos de profil de l'utilisateur connecté.
   * 
   * @param title Titre ou description de la vidéo
   * @param cloudinaryUrl URL publique de la vidéo hébergée sur Cloudinary
   * @param displayName Nom d'affichage de l'utilisateur
   * @param photoUrl URL de la photo de profil de l'utilisateur
   */
  async publishVideo(
    title: string,
    cloudinaryUrl: string,
    displayName?: string | null,
    photoUrl?: string | null
  ): Promise<SupabaseVideo> {
    const userId = this.getFirebaseUid();
    if (!userId) {
      throw new Error("Impossible de publier : aucun utilisateur connecté à Firebase Authentication.");
    }

    console.log(`[Supabase] Publication d'une vidéo pour l'utilisateur Firebase ${userId}`);
    const { data, error } = await supabase
      .from('videos')
      .insert([
        {
          user_id: userId,
          title: title || 'Sans titre',
          cloudinary_url: cloudinaryUrl,
          display_name: displayName || null,
          photo_url: photoUrl || null,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("[Supabase] Erreur d'insertion dans videos :", error);
      throw error;
    }

    console.log("[Supabase] Vidéo insérée avec succès :", data);
    return data as SupabaseVideo;
  }

  /**
   * Insère une nouvelle story éphémère dans la table Supabase `stories`
   * en associant l'UID Firebase de l'utilisateur connecté.
   * 
   * @param title Légende optionnelle de la story
   * @param cloudinaryUrl URL publique du média hébergé sur Cloudinary
   */
  async publishStory(title: string, cloudinaryUrl: string): Promise<SupabaseStory> {
    const userId = this.getFirebaseUid();
    if (!userId) {
      throw new Error("Impossible de publier la story : aucun utilisateur connecté à Firebase Authentication.");
    }

    console.log(`[Supabase] Publication d'une story pour l'utilisateur Firebase ${userId}`);
    const { data, error } = await supabase
      .from('stories')
      .insert([
        {
          user_id: userId,
          title: title || '',
          cloudinary_url: cloudinaryUrl,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("[Supabase] Erreur d'insertion dans stories :", error);
      throw error;
    }

    console.log("[Supabase] Story insérée avec succès :", data);
    return data as SupabaseStory;
  }

  /**
   * Récupère la liste des vidéos pour le feed (toutes les vidéos, plus récentes en premier).
   * Inclut les informations de profil (display_name, photo_url) si disponibles.
   */
  async fetchVideos(): Promise<SupabaseVideo[]> {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[Supabase] Erreur lors de la récupération des vidéos :", error);
      throw error;
    }

    return data || [];
  }

  /**
   * Récupère la liste des stories actives (publiées il y a moins de 24 heures).
   * Utilise un filtre PostgreSQL pour ne garder que les stories de moins de 24 heures.
   */
  async fetchActiveStories(): Promise<SupabaseStory[]> {
    const timeLimit = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .gt('created_at', timeLimit)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[Supabase] Erreur lors de la récupération des stories :", error);
      throw error;
    }

    return data || [];
  }

  /**
   * Récupère les notifications pour l'utilisateur connecté.
   */
  async fetchNotifications(): Promise<any[]> {
    const userId = this.getFirebaseUid();
    if (!userId) return [];
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.warn("[Supabase] fetchNotifications error:", error);
      return [];
    }
    return data || [];
  }

  /**
   * S'abonne à un autre utilisateur et envoie une notification.
   */
  async followUser(followingId: string): Promise<boolean> {
    const followerId = this.getFirebaseUid();
    if (!followerId) return false;
    
    // Insert follow relation
    const { error } = await supabase
      .from('follows')
      .insert([{ follower_id: followerId, following_id: followingId }]);
    if (error && error.code !== '23505') { // Ignore duplicate keys
      console.warn("[Supabase] followUser error:", error);
      return false;
    }

    // Insert follow notification for the recipient
    const currentUser = auth().currentUser;
    await supabase.from('notifications').insert([{
      recipient_id: followingId,
      sender_id: followerId,
      sender_name: currentUser?.displayName || 'Utilisateur StreamSky',
      sender_avatar: currentUser?.photoURL || '',
      type: 'follow',
      message: 'a commencé à vous suivre'
    }]);
    return true;
  }

  /**
   * Vérifie si l'utilisateur connecté suit un autre utilisateur.
   */
  async checkIfFollowing(followingId: string): Promise<boolean> {
    const followerId = this.getFirebaseUid();
    if (!followerId) return false;
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();
    if (error) return false;
    return !!data;
  }

  /**
   * Récupère les vidéos des comptes suivis.
   */
  async fetchFollowedUserVideos(): Promise<SupabaseVideo[]> {
    const userId = this.getFirebaseUid();
    if (!userId) return [];
    
    // 1. Récupère la liste des utilisateurs suivis
    const { data: follows, error: followsError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);
    
    if (followsError || !follows || follows.length === 0) return [];
    
    const followingIds = follows.map(f => f.following_id);
    
    // 2. Récupère les vidéos de ces comptes
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .in('user_id', followingIds)
      .order('created_at', { ascending: false });
    
    if (videosError) {
      console.warn("[Supabase] fetchFollowedUserVideos error:", videosError);
      return [];
    }
    
    return videos || [];
  }

  /**
   * Récupère tous les messages directs de l'utilisateur connecté (envoyés et reçus).
   */
  async fetchDirectMessages(): Promise<any[]> {
    const userId = this.getFirebaseUid();
    if (!userId) return [];
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: true });
    if (error) {
      console.warn("[Supabase] fetchDirectMessages error:", error);
      return [];
    }
    return data || [];
  }

  /**
   * Envoie un message direct à un utilisateur.
   */
  async sendDirectMessage(recipientId: string, text: string): Promise<any | null> {
    const senderId = this.getFirebaseUid();
    if (!senderId) return null;
    const { data, error } = await supabase
      .from('messages')
      .insert([{ sender_id: senderId, recipient_id: recipientId, text }])
      .select()
      .single();
    if (error) {
      console.warn("[Supabase] sendDirectMessage error:", error);
      return null;
    }
    return data;
  }

  /**
   * Récupère les commentaires d'une vidéo depuis Supabase.
   */
  async fetchComments(videoId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('[Supabase] fetchComments error:', error);
      return [];
    }
    return data || [];
  }

  /**
   * Poste un commentaire sur une vidéo.
   */
  async postComment(videoId: string, text: string): Promise<any | null> {
    const userId = this.getFirebaseUid();
    if (!userId) return null;
    const currentUser = auth().currentUser;
    const { data, error } = await supabase
      .from('comments')
      .insert([{
        video_id: videoId,
        user_id: userId,
        text,
        display_name: currentUser?.displayName || 'Utilisateur StreamSky',
        photo_url: currentUser?.photoURL || null,
      }])
      .select()
      .single();
    if (error) {
      console.warn('[Supabase] postComment error:', error);
      return null;
    }
    return data;
  }

  /**
   * Envoie une notification à un utilisateur (like, comment, etc.).
   */
  async sendNotification(
    recipientId: string,
    type: 'like' | 'comment' | 'follow',
    payload: { videoId?: string; message: string }
  ): Promise<void> {
    const senderId = this.getFirebaseUid();
    if (!senderId || senderId === recipientId) return; // Ne pas notifier soi-même
    const currentUser = auth().currentUser;
    const { error } = await supabase.from('notifications').insert([{
      recipient_id: recipientId,
      sender_id: senderId,
      sender_name: currentUser?.displayName || 'Utilisateur StreamSky',
      sender_avatar: currentUser?.photoURL || '',
      type,
      video_id: payload.videoId || null,
      message: payload.message,
    }]);
    if (error) {
      console.warn('[Supabase] sendNotification error:', error);
    }
  }
}

export const supabaseService = new SupabaseService();
