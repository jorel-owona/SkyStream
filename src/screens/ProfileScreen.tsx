import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import { useAuth } from '../context/AuthContext';
import { sampleVideos, VideoItem } from '../services/CloudinaryService';

const { width, height } = Dimensions.get('window');

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
];

const ProfileScreen = () => {
  const { user, logout, updateProfile, bookmarkedIds, likedIds, setIsCameraOpen, setCameraMode } = useAuth();

  // Publish shortcut handlers
  const openPublishVideo = () => {
    setCameraMode('video');
    setIsCameraOpen(true);
  };

  const openPublishStory = () => {
    setCameraMode('story');
    setIsCameraOpen(true);
  };

  const showPublishMenu = () => {
    if (isGuest) {
      Alert.alert('Connexion requise', 'Connectez-vous pour publier du contenu.');
      return;
    }
    Alert.alert(
      'Créer du contenu',
      'Choisissez le type de publication',
      [
        { text: 'Publier une Vidéo 🎬', onPress: openPublishVideo },
        { text: 'Créer une Story ✨', onPress: openPublishStory },
        { text: 'Modifier le profil', onPress: openEditProfile },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };
  const [activeProfileTab, setActiveProfileTab] = useState<'posts' | 'private' | 'bookmarks' | 'likes'>('posts');
  
  // Edit Profile Modal States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editPhotoURL, setEditPhotoURL] = useState(user?.photoURL || PRESET_AVATARS[0]);

  // Video Preview State
  const [previewVideo, setPreviewVideo] = useState<VideoItem | null>(null);

  const isGuest = user?.isGuest ?? true;
  const suivisCount = isGuest ? 0 : 124;
  const abonneesCount = isGuest ? 0 : 374;
  const likesCount = isGuest ? 0 : likedIds.length + 842;

  const formattedUsername = user?.displayName
    ? `@${user.displayName.toLowerCase().replace(/\s+/g, '_')}`
    : '@streamsky_user';

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se déconnecter', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleInviteFriends = () => {
    if (isGuest) {
      Alert.alert(
        'Connexion requise',
        'Veuillez vous connecter ou vous inscrire pour inviter des amis.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter / S\'inscrire', onPress: logout },
        ]
      );
      return;
    }
    Alert.alert(
      'Inviter des amis',
      'Partagez l\'application : Envoyez un lien d\'invitation StreamSky à vos proches ! 🤝📱',
      [{ text: 'Génial !' }]
    );
  };

  const handleInstagramLink = () => {
    if (isGuest) {
      Alert.alert(
        'Connexion requise',
        'Veuillez vous connecter ou vous inscrire pour associer votre compte Instagram.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter / S\'inscrire', onPress: logout },
        ]
      );
      return;
    }
    Alert.alert(
      'Instagram',
      'Associer votre compte Instagram pour partager directement vos créations.',
      [{ text: 'Fermer' }]
    );
  };

  const openEditProfile = () => {
    if (isGuest) {
      Alert.alert(
        'Connexion requise',
        'Veuillez vous connecter ou vous inscrire pour personnaliser votre profil.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter / S\'inscrire', onPress: logout },
        ]
      );
      return;
    }
    setEditName(user?.displayName || '');
    setEditBio(user?.bio || '');
    setEditPhotoURL(user?.photoURL || PRESET_AVATARS[0]);
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Erreur', 'Le nom ne peut pas être vide.');
      return;
    }
    await updateProfile(editName.trim(), editBio.trim(), editPhotoURL);
    setEditModalVisible(false);
  };

  const getCloudinaryThumbnail = (videoUrl: string) => {
    try {
      if (videoUrl.includes('/video/upload/')) {
        return videoUrl
          .replace('.mp4', '.jpg')
          .replace('/video/upload/', '/video/upload/c_fill,w_250,h_350,so_0/');
      }
      return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200';
    } catch {
      return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200';
    }
  };

  const getGridVideos = (): VideoItem[] => {
    if (isGuest) return []; // For guest, everything is at zero/empty!
    if (activeProfileTab === 'posts') {
      return sampleVideos;
    } else if (activeProfileTab === 'bookmarks') {
      return sampleVideos.filter(video => bookmarkedIds.includes(video.id));
    } else if (activeProfileTab === 'likes') {
      return sampleVideos.filter(video => likedIds.includes(video.id));
    }
    return [];
  };

  const gridVideos = getGridVideos();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={handleInviteFriends}>
          <Icon name="person-add-outline" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user?.displayName || 'Profil'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <TouchableOpacity style={styles.headerIcon} onPress={showPublishMenu}>
            <Icon name="add-circle-outline" size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={handleLogout}>
            <Icon name="log-out-outline" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="person" size={50} color={colors.background} />
              </View>
            )}
            <TouchableOpacity style={styles.addAvatarButton} onPress={showPublishMenu}>
              <Icon name="add" size={14} color={colors.white} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.username}>{formattedUsername}</Text>

          {/* Followers / Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statCount}>{suivisCount}</Text>
              <Text style={styles.statLabel}>Abonnements</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statCount}>{abonneesCount}</Text>
              <Text style={styles.statLabel}>Abonnés</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statCount}>{likesCount}</Text>
              <Text style={styles.statLabel}>J'aime</Text>
            </View>
          </View>

          {/* Edit Profile Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.editButton} onPress={openEditProfile}>
              <Text style={styles.editButtonText}>Modifier le profil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleInstagramLink}>
              <Icon name="logo-instagram" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* Publishing Shortcuts */}
          <View style={styles.publishShortcuts}>
            <TouchableOpacity style={styles.publishBtn} onPress={openPublishVideo}>
              <View style={styles.publishIconBg}>
                <Icon name="videocam" size={18} color={colors.white} />
              </View>
              <Text style={styles.publishBtnText}>Publier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.publishBtn} onPress={openPublishStory}>
              <View style={[styles.publishIconBg, { backgroundColor: colors.secondary }]}>
                <Icon name="flash" size={18} color={colors.white} />
              </View>
              <Text style={styles.publishBtnText}>Story</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.bio}>
            {user?.bio || (isGuest 
              ? "Bienvenue sur mon profil StreamSky ! ✨" 
              : "Nouveau créateur de contenu sur StreamSky. Suivez mes prochaines vidéos ! 🎬🔥"
            )}
          </Text>
        </View>

        {/* Tab Selection */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeProfileTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveProfileTab('posts')}
          >
            <Icon name="grid-outline" size={22} color={activeProfileTab === 'posts' ? colors.white : colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeProfileTab === 'private' && styles.activeTab]}
            onPress={() => setActiveProfileTab('private')}
          >
            <Icon name="lock-closed-outline" size={22} color={activeProfileTab === 'private' ? colors.white : colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeProfileTab === 'bookmarks' && styles.activeTab]}
            onPress={() => setActiveProfileTab('bookmarks')}
          >
            <Icon name="bookmark-outline" size={22} color={activeProfileTab === 'bookmarks' ? colors.white : colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeProfileTab === 'likes' && styles.activeTab]}
            onPress={() => setActiveProfileTab('likes')}
          >
            <Icon name="heart-outline" size={22} color={activeProfileTab === 'likes' ? colors.white : colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Dynamic Video Grid Content */}
        {activeProfileTab === 'private' ? (
          <View style={styles.emptyGridContainer}>
            <Icon name="lock-closed" size={48} color="rgba(255, 255, 255, 0.2)" />
            <Text style={styles.emptyGridText}>Vidéos privées</Text>
            <Text style={styles.emptyGridSub}>Vos vidéos privées ne sont visibles que par vous.</Text>
          </View>
        ) : gridVideos.length === 0 ? (
          <View style={styles.emptyGridContainer}>
            <Icon 
              name={
                activeProfileTab === 'bookmarks' 
                  ? 'bookmark' 
                  : activeProfileTab === 'likes' 
                  ? 'heart' 
                  : 'videocam'
              } 
              size={48} 
              color="rgba(255, 255, 255, 0.2)" 
            />
            <Text style={styles.emptyGridText}>
              {activeProfileTab === 'bookmarks' 
                ? 'Aucun favori pour l\'instant' 
                : activeProfileTab === 'likes' 
                ? 'Aucune vidéo aimée' 
                : 'Aucune publication'
              }
            </Text>
            <Text style={styles.emptyGridSub}>
              {activeProfileTab === 'bookmarks' 
                ? 'Enregistrez des vidéos dans les favoris pour les afficher.' 
                : activeProfileTab === 'likes' 
                ? 'Aimez des vidéos pour les afficher ici.' 
                : 'Vos créations s\'afficheront ici.'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {gridVideos.map((video) => (
              <TouchableOpacity key={video.id} style={styles.gridItem} onPress={() => setPreviewVideo(video)}>
                <Image source={{ uri: video.thumbnailUrl || getCloudinaryThumbnail(video.videoUrl) }} style={styles.gridThumbnail} />
                <View style={styles.gridLikesOverlay}>
                  <Icon name="play-outline" size={12} color={colors.white} style={styles.playIcon} />
                  <Text style={styles.gridLikesText}>{video.likes}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Modifier le profil</Text>
              <TouchableOpacity onPress={handleSaveProfile}>
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Profile Image Select */}
              <View style={styles.editAvatarSection}>
                <Image source={{ uri: editPhotoURL }} style={styles.editAvatarPreview} />
                <Text style={styles.editAvatarLabel}>Choisissez une photo de profil :</Text>
                <View style={styles.presetAvatarsContainer}>
                  {PRESET_AVATARS.map((url, i) => (
                    <TouchableOpacity 
                      key={i} 
                      onPress={() => setEditPhotoURL(url)}
                      style={[
                        styles.presetAvatarBtn,
                        editPhotoURL === url && styles.presetAvatarBtnSelected
                      ]}
                    >
                      <Image source={{ uri: url }} style={styles.presetAvatarThumb} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Input Nom */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nom d'affichage</Text>
                <TextInput
                  style={styles.textInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Nom"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  maxLength={30}
                />
              </View>

              {/* Input Bio */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Biographie (Bio)</Text>
                <TextInput
                  style={[styles.textInput, styles.bioInput]}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Écrivez une courte bio..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  multiline={true}
                  numberOfLines={3}
                  maxLength={80}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Video Preview Modal */}
      <Modal
        visible={previewVideo !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPreviewVideo(null)}
      >
        <View style={styles.previewOverlay}>
          <TouchableOpacity 
            style={styles.previewCloseBtn} 
            onPress={() => setPreviewVideo(null)}
          >
            <Icon name="close" size={28} color={colors.white} />
          </TouchableOpacity>
          
          {previewVideo && (
            <View style={styles.previewVideoContainer}>
              <Video
                source={{ uri: previewVideo.videoUrl }}
                style={styles.previewVideoPlayer}
                resizeMode="contain"
                repeat={true}
                paused={false}
                muted={false}
                onError={(e) => console.log('Preview Video Error:', e)}
              />
              <View style={styles.previewDetails}>
                <Text style={styles.previewUser}>@{previewVideo.username}</Text>
                <Text style={styles.previewDesc}>{previewVideo.description}</Text>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.surfaceLight,
  },
  headerIcon: {
    padding: 6,
  },
  headerTitle: {
    ...typography.h2,
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileInfo: {
    alignItems: 'center',
    paddingTop: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: colors.surfaceLight,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  username: {
    ...typography.h3,
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    width: 100,
  },
  statCount: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 0.5,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    width: '100%',
    paddingHorizontal: 24,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  iconButton: {
    backgroundColor: colors.surface,
    width: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bio: {
    color: colors.white,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 18,
    marginBottom: 16,
  },
  publishShortcuts: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  publishBtn: {
    alignItems: 'center',
    gap: 4,
  },
  publishIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishBtnText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: colors.surfaceLight,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.surfaceLight,
    backgroundColor: colors.background,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 1.5,
    borderBottomColor: colors.white,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.black,
    paddingTop: 1,
  },
  gridItem: {
    width: width / 3 - 0.7,
    height: (width / 3) * 1.35,
    backgroundColor: colors.surface,
    marginRight: 1,
    marginBottom: 1,
    position: 'relative',
  },
  gridThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridLikesOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playIcon: {
    marginRight: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gridLikesText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Empty states
  emptyGridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyGridText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyGridSub: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  // Modal Edit Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  modalContent: {
    height: height * 0.8,
    backgroundColor: '#1E152E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  saveButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  modalScroll: {
    padding: 20,
  },
  editAvatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  editAvatarPreview: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: 16,
  },
  editAvatarLabel: {
    color: colors.white,
    fontSize: 13,
    marginBottom: 10,
    fontWeight: '600',
  },
  presetAvatarsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  presetAvatarBtn: {
    padding: 2,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetAvatarBtnSelected: {
    borderColor: colors.primary,
  },
  presetAvatarThumb: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 16,
    color: colors.white,
    fontSize: 14,
  },
  bioInput: {
    height: 80,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  previewVideoContainer: {
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  previewVideoPlayer: {
    width: '100%',
    height: '100%',
  },
  previewDetails: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 8,
  },
  previewUser: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  previewDesc: {
    color: colors.white,
    fontSize: 13,
  },
});

export default ProfileScreen;
