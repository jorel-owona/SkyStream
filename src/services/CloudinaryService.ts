/**
 * Cloudinary video helper service.
 * Standard URL format: https://res.cloudinary.com/<cloud_name>/video/upload/<transformations>/<public_id>.<format>
 */

export interface VideoItem {
  id: string;
  videoUrl: string;
  username: string;
  description: string;
  songName: string;
  likes: number;
  commentsCount: number;
  bookmarks: number;
  shares: number;
  views?: number;
  userAvatar?: string;
  userId?: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isFollowed?: boolean;
  thumbnailUrl?: string;
}

// Default Cloudinary configuration
const CLOUD_NAME = 'dwfvxe1ne'; // Cloudinary cloud name
const UPLOAD_PRESET = 'streamsky_preset'; // Unsigned upload preset configuré dans le dashboard Cloudinary

/**
 * URL de repli HLS publique et fonctionnelle, utilisée si le téléversement échoue.
 * Il s'agit de la vidéo d'introduction officielle StreamSky hébergée sur Cloudinary.
 */
const FALLBACK_HLS_URL = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/f_auto,q_auto/v1781006675/introduction_gewbzq.m3u8`;

/**
 * Téléverse une vidéo ou une story sur Cloudinary sans signature (Unsigned Upload).
 *
 * Prend en charge les URI locales Android (`content://` et `file://`) et iOS.
 * En cas d'échec réseau ou d'erreur API, retourne l'URL de repli HLS pour
 * éviter tout écran noir dans le feed.
 *
 * @param fileUri - L'URI locale du fichier vidéo (ex: file:///data/... ou content://...)
 * @returns L'URL HTTPS Cloudinary de la vidéo téléversée, ou l'URL de repli en cas d'échec
 */
export const uploadVideoToCloudinary = async (fileUri: string): Promise<string> => {
  // Normalisation de l'URI pour Android (content:// → file://)
  let cleanUri = fileUri;
  if (
    !cleanUri.startsWith('file://') &&
    !cleanUri.startsWith('content://') &&
    !cleanUri.startsWith('http')
  ) {
    cleanUri = `file://${cleanUri}`;
  }

  try {
    // 1. Préparation du FormData (format requis par l'API REST de Cloudinary)
    const formData = new FormData();
    formData.append('file', {
      uri: cleanUri,
      type: 'video/mp4', // Format universel ; iOS MOV est généralement ré-encodé côté serveur
      name: 'upload_streamsky_video.mp4',
    } as any);
    formData.append('upload_preset', UPLOAD_PRESET);

    // 2. Envoi de la requête à l'API REST Cloudinary (unsigned)
    console.log(`[Cloudinary] Début du téléversement vers Cloudinary... URI : ${cleanUri}`);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // 3. Traitement de la réponse
    const data = await response.json();

    if (response.ok && data.secure_url) {
      console.log(`[Cloudinary] Téléversement réussi ! URL : ${data.secure_url}`);
      return data.secure_url; // URL HTTPS de la vidéo publiée
    } else {
      const errorMsg = data.error?.message || 'Réponse inattendue de l\'API Cloudinary';
      console.warn(`[Cloudinary] Échec API : ${errorMsg}`);
      console.log(`[Cloudinary] Repli vers : ${FALLBACK_HLS_URL}`);
      return FALLBACK_HLS_URL;
    }
  } catch (error: any) {
    // Erreur réseau, timeout, ou problème de parsing JSON
    console.error(`[Cloudinary] Erreur réseau / Téléversement raté :`, error?.message || error);
    console.log(`[Cloudinary] Repli vers : ${FALLBACK_HLS_URL}`);
    return FALLBACK_HLS_URL;
  }
};

/**
 * Generate an optimized Cloudinary video URL with specified transformations.
 * We apply q_auto (auto quality) and f_mp4 (force mp4 for Android compatibility)
 */
export const getCloudinaryVideoUrl = (
  publicId: string,
  transformations: string = 'q_auto,f_mp4'
): string => {
  // If publicId is already a full URL, return it directly
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
    return publicId;
  }
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${transformations}/${publicId}.mp4`;
};

/**
 * Converts a Supabase video record into a VideoItem for the feed.
 * Used when loading real videos published by users.
 */
export const supabaseVideoToItem = (supabaseVideo: {
  id: string;
  user_id: string;
  title: string | null;
  cloudinary_url: string;
  created_at: string;
  display_name?: string | null;
  photo_url?: string | null;
}): VideoItem => ({
  id: supabaseVideo.id,
  videoUrl: supabaseVideo.cloudinary_url,
  username: supabaseVideo.display_name || `user_${supabaseVideo.user_id.substring(0, 8)}`,
  description: supabaseVideo.title || '',
  songName: 'Son original',
  likes: 0,
  commentsCount: 0,
  bookmarks: 0,
  shares: 0,
  views: 0,
  userAvatar: supabaseVideo.photo_url || undefined,
  userId: supabaseVideo.user_id,
  isLiked: false,
  isBookmarked: false,
  isFollowed: false,
});

/**
 * Seed videos: only real Cloudinary videos that actually exist in the account.
 * These are displayed in the feed alongside user-published videos from Supabase.
 */
export const sampleVideos: VideoItem[] = [
  {
    id: 'vid-intro-streamsky',
    videoUrl: 'https://res.cloudinary.com/dwfvxe1ne/video/upload/f_auto,q_auto/v1781006675/introduction_gewbzq.m3u8',
    username: 'streamsky_official',
    description: 'Bienvenue sur StreamSky ! 🚀 La plateforme de partage vidéo made in Cameroun. #streamsky #introduction',
    songName: 'StreamSky Intro (Son original)',
    likes: 489,
    commentsCount: 12,
    bookmarks: 56,
    shares: 20,
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    isLiked: false,
    isBookmarked: false,
    isFollowed: false,
    thumbnailUrl: 'https://res.cloudinary.com/dwfvxe1ne/image/upload/q_auto/f_auto/v1781000638/1360490_gdwql0.jpg',
  },
];
