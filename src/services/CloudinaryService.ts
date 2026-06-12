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
  userAvatar?: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isFollowed?: boolean;
  thumbnailUrl?: string;
}

// Default Cloudinary configuration
const CLOUD_NAME = 'dwfvxelne'; // Using user's Cloudinary cloud name

/**
 * Generate an optimized Cloudinary video URL with specified transformations.
 * We apply q_auto (auto quality) and f_auto (auto format, e.g. converting to webm/mp4 based on device support)
 */
export const getCloudinaryVideoUrl = (
  publicId: string,
  transformations: string = 'q_auto,f_mp4' // Force mp4 instead of f_auto to avoid playback crashes on Android
): string => {
  // If publicId is already a full URL, return it directly
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
    return publicId;
  }
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${transformations}/${publicId}.mp4`;
};

// Initial set of sample TikTok-style videos hosted on Cloudinary
export const sampleVideos: VideoItem[] = [
  {
    id: 'vid-user-1',
    videoUrl: 'https://res.cloudinary.com/dwfvxelne/video/upload/f_auto,q_auto/v1781006675/introduction_gewbzq.m3u8',
    username: 'jorel_owona',
    description: 'Introduction officielle de StreamSky ! 🚀 Découvrez le futur du partage vidéo. #streamsky #introduction #m3u8 #hls',
    songName: 'StreamSky Intro (Son original)',
    likes: 4890,
    commentsCount: 142,
    bookmarks: 672,
    shares: 203,
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    isLiked: false,
    isBookmarked: false,
    isFollowed: false,
    thumbnailUrl: 'https://res.cloudinary.com/dwfvxe1ne/image/upload/q_auto/f_auto/v1781000638/1360490_gdwql0.jpg',
  },
  {
    id: 'vid-1',
    videoUrl: getCloudinaryVideoUrl('dog', 'q_auto,f_auto,c_fill,w_720,h_1280'),
    username: 'monkam_sante',
    description: '4 signes précoces de l\'insuffisance cardiaque. Prenez soin de vous ! ❤️ #sante #coeur #docteurs',
    songName: 'Ndiba - Elisha (Son original)',
    likes: 1205,
    commentsCount: 342,
    bookmarks: 89,
    shares: 154,
    userAvatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150',
    isLiked: false,
    isBookmarked: false,
    isFollowed: false,
  },
  {
    id: 'vid-2',
    videoUrl: getCloudinaryVideoUrl('dirt-road', 'q_auto,f_auto,c_fill,w_720,h_1280'),
    username: 'travel_adventures',
    description: 'Road trip incroyable à travers les montagnes ! 🏔️🚗 Qui veut venir ? #roadtrip #travel #adventure',
    songName: 'Chill Lo-Fi Beats - Sunset Café',
    likes: 8530,
    commentsCount: 948,
    bookmarks: 1243,
    shares: 412,
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    isLiked: false,
    isBookmarked: false,
    isFollowed: false,
  },
  {
    id: 'vid-3',
    videoUrl: getCloudinaryVideoUrl('sea-waves', 'q_auto,f_auto,c_fill,w_720,h_1280'),
    username: 'nature_calm',
    description: 'Relaxez-vous avec le bruit des vagues et le coucher de soleil... 🌅🌊 #relaxation #ocean #peace',
    songName: 'Sounds of Nature - Ocean Waves ASMR',
    likes: 4205,
    commentsCount: 184,
    bookmarks: 532,
    shares: 98,
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    isLiked: false,
    isBookmarked: false,
    isFollowed: false,
  },
  {
    id: 'vid-4',
    videoUrl: getCloudinaryVideoUrl('forest', 'q_auto,f_auto,c_fill,w_720,h_1280'),
    username: 'drone_feed',
    description: 'Survol d\'une forêt mystique ce matin en automne. La brume était magnifique. 🍁🌲 #drone #djiphantom',
    songName: 'Ambient Soundscape - Deep Forest',
    likes: 6710,
    commentsCount: 290,
    bookmarks: 730,
    shares: 245,
    userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    isLiked: false,
    isBookmarked: false,
    isFollowed: false,
  }
];
