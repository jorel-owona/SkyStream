import { supabase } from '../libs/supabase';
import auth from '@react-native-firebase/auth';

export interface SupabaseVideo {
  id: string;
  user_id: string;
  title: string | null;
  cloudinary_url: string;
  created_at: string;
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
   * Simule le téléversement d'un fichier vidéo vers Cloudinary.
   * Une fois que vous me fournirez votre API de téléversement (ex: Cloudinary SDK ou fetch upload API),
   * nous remplacerons cette simulation par l'appel de téléversement réel.
   * 
   * @param localUri Chemin d'accès local du fichier vidéo (ex: file://...)
   */
  async uploadToCloudinarySimulated(localUri: string): Promise<string> {
    console.log(`[Cloudinary] Début du téléversement simulé pour : ${localUri}`);
    // Simulation d'une attente réseau (1.5 seconde)
    await new Promise<void>((resolve) => setTimeout(resolve, 1500));
    
    // Extraction du nom du fichier pour simuler une URL personnalisée
    const filename = localUri.split('/').pop() || 'media_video';
    const cleanName = filename.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    
    // URL simulée sur le Cloud Name de l'utilisateur ('dwfvxelne')
    const simulatedUrl = `https://res.cloudinary.com/dwfvxelne/video/upload/q_auto,f_mp4/v1781006675/${cleanName}.mp4`;
    console.log(`[Cloudinary] Téléversement réussi. URL : ${simulatedUrl}`);
    return simulatedUrl;
  }

  /**
   * Insère une nouvelle vidéo dans la table Supabase `videos`
   * en associant l'UID Firebase de l'utilisateur connecté.
   * 
   * @param title Titre ou description de la vidéo
   * @param cloudinaryUrl URL publique de la vidéo hébergée sur Cloudinary
   */
  async publishVideo(title: string, cloudinaryUrl: string): Promise<SupabaseVideo> {
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
   * Récupère la liste des vidéos publiques.
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
}

export const supabaseService = new SupabaseService();
