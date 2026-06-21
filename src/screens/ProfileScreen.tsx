import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, Share, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import { useAuth } from '../context/AuthContext';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import QRCode from 'react-native-qrcode-svg';

import { sampleVideos, VideoItem, supabaseVideoToItem } from '../services/CloudinaryService';
import { supabaseService } from '../services/SupabaseService';

const { width, height } = Dimensions.get('window');

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
];

const ProfileScreen = () => {
  const { user, logout, updateProfile, bookmarkedIds, likedIds, setIsCameraOpen, setCameraMode, toggleLike, toggleBookmark } = useAuth();

  // Publish shortcut handlers
  const openPublishVideo = () => {
    setCameraMode('video');
    setIsCameraOpen(true);
  };

  const openPublishStory = () => {
    setCameraMode('story');
    setIsCameraOpen(true);
  };

  const [publishMenuVisible, setPublishMenuVisible] = useState(false);

  const showPublishMenu = () => {
    if (isGuest) {
      Alert.alert('Connexion requise', 'Connectez-vous pour publier du contenu.');
      return;
    }
    setPublishMenuVisible(true);
  };
  const [activeProfileTab, setActiveProfileTab] = useState<'posts' | 'private' | 'bookmarks' | 'likes'>('posts');
  
  // Edit Profile Modal States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editPhotoURL, setEditPhotoURL] = useState(user?.photoURL || PRESET_AVATARS[0]);
  const [editWebsite, setEditWebsite] = useState(user?.website || '');

  // Video Preview State
  const [previewVideo, setPreviewVideo] = useState<VideoItem | null>(null);

  // QR Code Modal State
  const [qrModalVisible, setQrModalVisible] = useState(false);

  // User's published videos from Supabase
  const [userVideos, setUserVideos] = useState<VideoItem[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);

  const isGuest = user?.isGuest ?? true;

  const openQrModal = () => {
    if (isGuest) {
      Alert.alert('Connexion requise', 'Connectez-vous pour voir votre code QR.');
      return;
    }
    setQrModalVisible(true);
  };

  // Load user's own published videos
  const loadUserVideos = useCallback(async () => {
    if (isGuest) {
      setIsLoadingVideos(false);
      return;
    }
    try {
      setIsLoadingVideos(true);
      const allVideos = await supabaseService.fetchVideos();
      const uid = supabaseService.getFirebaseUid();
      const myVideos = allVideos
        .filter(v => v.user_id === uid)
        .map(supabaseVideoToItem);
      setUserVideos(myVideos);
    } catch (e) {
      console.error('[ProfileScreen] Erreur chargement vidéos utilisateur:', e);
    } finally {
      setIsLoadingVideos(false);
    }
  }, [isGuest]);

  useEffect(() => {
    loadUserVideos();
  }, [loadUserVideos]);

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Découvre mon profil StreamSky ! ${formattedUsername} : https://streamsky.app/user/${formattedUsername.replace('@', '')}`,
      });
    } catch (e) {
      console.log('Share profile error:', e);
    }
  };

  const MockQrCode = () => {
    return (
      <View style={styles.qrGridContainer}>
        <QRCode
          value={profileUrl}
          size={180}
          color={colors.primary}
          backgroundColor="transparent"
          logo={{ uri: user?.photoURL || PRESET_AVATARS[0] }}
          logoSize={40}
          logoBorderRadius={20}
          logoBackgroundColor="#1E152E"
        />
      </View>
    );
  };
  const suivisCount = 0;
  const abonneesCount = 0;
  const likesCount = likedIds.length;

  const formattedUsername = user?.displayName
    ? `@${user.displayName.toLowerCase().replace(/\s+/g, '_')}`
    : '@streamsky_user';

  const profileUrl = `https://streamsky.app/user/${(user?.displayName || 'user').toLowerCase().replace(/\s+/g, '_')}`;

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

  const handleLaunchCamera = () => {
    launchCamera(
      {
        mediaType: 'photo',
        cameraType: 'back',
        quality: 0.8,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled camera');
        } else if (response.errorCode) {
          Alert.alert('Erreur', response.errorMessage || 'Impossible d\'ouvrir l\'appareil photo');
        } else if (response.assets && response.assets.length > 0) {
          const uri = response.assets[0].uri;
          if (uri) {
            setEditPhotoURL(uri);
          }
        }
      }
    );
  };

  const handleLaunchGallery = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled gallery');
        } else if (response.errorCode) {
          Alert.alert('Erreur', response.errorMessage || 'Impossible d\'ouvrir la galerie');
        } else if (response.assets && response.assets.length > 0) {
          const uri = response.assets[0].uri;
          if (uri) {
            setEditPhotoURL(uri);
          }
        }
      }
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
    setEditWebsite(user?.website || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Erreur', 'Le nom ne peut pas être vide.');
      return;
    }
    await updateProfile(editName.trim(), editBio.trim(), editPhotoURL, editWebsite.trim());
    setEditModalVisible(false);
  };

  const getCloudinaryThumbnail = (videoUrl: string) => {
    try {
      // Handle HLS .m3u8 URLs from Cloudinary - extract thumbnail via image endpoint
      if (videoUrl.includes('/video/upload/') && videoUrl.includes('.m3u8')) {
        // Convert HLS manifest URL to a JPEG thumbnail
        return videoUrl
          .replace('/video/upload/', '/video/upload/c_fill,w_250,h_350,so_0/')
          .replace('.m3u8', '.jpg');
      }
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
    if (activeProfileTab === 'posts') {
      return userVideos;
    } else if (activeProfileTab === 'bookmarks') {
      // Search across both real and sample videos
      const allVideos = [...userVideos, ...sampleVideos];
      return allVideos.filter(video => bookmarkedIds.includes(video.id));
    } else if (activeProfileTab === 'likes') {
      const allVideos = [...userVideos, ...sampleVideos];
      return allVideos.filter(video => likedIds.includes(video.id));
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
            <TouchableOpacity style={styles.iconButton} onPress={openQrModal}>
              <Icon name="qr-code-outline" size={18} color={colors.white} />
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
          
          {/* Biography, Link & Short Status */}
          <View style={styles.bioContainer}>
            <Text style={styles.bioText}>
              {user?.bio || 'Aucune biographie rédigée.'}
            </Text>
            {user?.website ? (
              <TouchableOpacity onPress={() => Alert.alert('Lien', `Ouverture de : ${user.website}`)}>
                <View style={styles.linkRow}>
                  <Icon name="link-outline" size={14} color={colors.primary} />
                  <Text style={styles.clickableLink} numberOfLines={1}>
                    {user.website}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : null}
            <View style={styles.briefTextContainer}>
              <Icon name="sparkles-outline" size={12} color={colors.secondary} style={{ marginRight: 4 }} />
              <Text style={styles.briefText}>
                Membre StreamSky vérifié 💫
              </Text>
            </View>
          </View>
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
        ) : isLoadingVideos && activeProfileTab === 'posts' ? (
          <View style={styles.emptyGridContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.emptyGridSub, { marginTop: 12 }]}>Chargement de vos vidéos...</Text>
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
                  <Text style={styles.gridLikesText}>
                    {video.views !== undefined ? video.views : Math.floor(video.likes * 4.2) + 24}
                  </Text>
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
                
                {/* Camera / Gallery Selection */}
                <View style={styles.uploadImageButtonsRow}>
                  <TouchableOpacity style={styles.uploadImageBtn} onPress={handleLaunchCamera}>
                    <Icon name="camera" size={16} color={colors.white} style={{ marginRight: 6 }} />
                    <Text style={styles.uploadImageBtnText}>Prendre une photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.uploadImageBtn} onPress={handleLaunchGallery}>
                    <Icon name="image" size={16} color={colors.white} style={{ marginRight: 6 }} />
                    <Text style={styles.uploadImageBtnText}>Galerie</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.editAvatarLabel}>Ou choisissez un avatar prédéfini :</Text>
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

              {/* Input Website */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Site web (Lien)</Text>
                <TextInput
                  style={styles.textInput}
                  value={editWebsite}
                  onChangeText={setEditWebsite}
                  placeholder="https://votre-site-web.com"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  maxLength={100}
                  autoCapitalize="none"
                  keyboardType="url"
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
          {previewVideo && (
            <View style={styles.previewVideoWrapper}>
              <Video
                source={{
                  uri: previewVideo.videoUrl,
                  ...(previewVideo.videoUrl?.includes('.m3u8') && { type: 'application/x-mpegurl' }),
                }}
                style={styles.previewVideoPlayer}
                resizeMode="cover"
                repeat={true}
                paused={false}
                muted={false}
                onError={(e) => console.log('Preview Video Error:', e)}
              />

              <TouchableOpacity 
                style={styles.previewCloseBtn} 
                onPress={() => setPreviewVideo(null)}
              >
                <Icon name="chevron-back" size={28} color={colors.white} />
              </TouchableOpacity>

              {/* Action buttons on the right side */}
              <View style={styles.previewRightActions}>
                {/* Like Button */}
                <TouchableOpacity 
                  style={styles.previewActionBtn} 
                  onPress={() => {
                    toggleLike(previewVideo.id);
                  }}
                >
                  <View style={styles.previewActionIconWrapper}>
                    <Icon
                      name={likedIds.includes(previewVideo.id) ? 'heart' : 'heart-outline'}
                      size={32}
                      color={likedIds.includes(previewVideo.id) ? colors.error : colors.white}
                    />
                  </View>
                  <Text style={styles.previewActionCount}>
                    {previewVideo.likes + (likedIds.includes(previewVideo.id) ? 1 : 0)}
                  </Text>
                </TouchableOpacity>

                {/* Comment Button */}
                <TouchableOpacity 
                  style={styles.previewActionBtn} 
                  onPress={() => Alert.alert('Commentaires', 'Cette fonctionnalité sera bientôt intégrée au lecteur de détails ! 💬')}
                >
                  <View style={styles.previewActionIconWrapper}>
                    <Icon name="chatbubble-ellipses" size={30} color={colors.white} />
                  </View>
                  <Text style={styles.previewActionCount}>{previewVideo.commentsCount}</Text>
                </TouchableOpacity>

                {/* Bookmark Button */}
                <TouchableOpacity 
                  style={styles.previewActionBtn} 
                  onPress={() => {
                    toggleBookmark(previewVideo.id);
                  }}
                >
                  <View style={styles.previewActionIconWrapper}>
                    <Icon
                      name={bookmarkedIds.includes(previewVideo.id) ? 'bookmark' : 'bookmark-outline'}
                      size={28}
                      color={bookmarkedIds.includes(previewVideo.id) ? colors.accent : colors.white}
                    />
                  </View>
                  <Text style={styles.previewActionCount}>
                    {previewVideo.bookmarks + (bookmarkedIds.includes(previewVideo.id) ? 1 : 0)}
                  </Text>
                </TouchableOpacity>

                {/* Share Button */}
                <TouchableOpacity 
                  style={styles.previewActionBtn} 
                  onPress={async () => {
                    try {
                      await Share.share({
                        message: `Découvre cette vidéo sur StreamSky de @${previewVideo.username} : ${previewVideo.videoUrl}`,
                      });
                    } catch (e) {
                      console.log('Share preview error:', e);
                    }
                  }}
                >
                  <View style={styles.previewActionIconWrapper}>
                    <Icon name="share-social" size={28} color={colors.white} />
                  </View>
                  <Text style={styles.previewActionCount}>{previewVideo.shares}</Text>
                </TouchableOpacity>
              </View>

              {/* Bottom metadata */}
              <View style={styles.previewBottomMetadata}>
                <Text style={styles.previewUserTag}>@{previewVideo.username}</Text>
                <Text style={styles.previewVideoDesc} numberOfLines={2}>
                  {previewVideo.description}
                </Text>
                <View style={styles.previewSongContainer}>
                  <Icon name="musical-notes" size={14} color={colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.previewSongText} numberOfLines={1}>
                    {previewVideo.songName || 'Son original'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        visible={qrModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalContent}>
            <View style={styles.qrModalHeader}>
              <Text style={styles.qrModalTitle}>Mon Code QR</Text>
              <TouchableOpacity onPress={() => setQrModalVisible(false)}>
                <Icon name="close" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.qrCard}>
              <Text style={styles.qrName}>{user?.displayName}</Text>
              <Text style={styles.qrUsername}>{formattedUsername}</Text>
              
              <MockQrCode />
              
              <Text style={styles.qrHelpText}>Scannez pour me suivre sur StreamSky 💫</Text>
            </View>

            <TouchableOpacity style={styles.qrShareBtn} onPress={handleShareProfile}>
              <Icon name="share-social-outline" size={20} color={colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.qrShareBtnText}>Partager mon profil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Custom Publish Menu Modal */}
      <Modal
        visible={publishMenuVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPublishMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setPublishMenuVisible(false)}
        >
          <View style={styles.publishMenuContent} onStartShouldSetResponder={() => true}>
            <View style={styles.publishMenuHeader}>
              <View style={styles.headerBar} />
              <Text style={styles.publishMenuTitle}>Créer du contenu</Text>
              <Text style={styles.publishMenuSubtitle}>Choisissez le type de publication ou d'action</Text>
            </View>

            <View style={styles.publishOptionsRow}>
              <TouchableOpacity 
                style={styles.publishOptionItem} 
                onPress={() => {
                  setPublishMenuVisible(false);
                  openPublishVideo();
                }}
              >
                <View style={[styles.publishOptionIconBg, { backgroundColor: colors.primary }]}>
                  <Icon name="videocam" size={24} color={colors.black} />
                </View>
                <Text style={styles.publishOptionLabel}>Publier une Vidéo 🎬</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.publishOptionItem} 
                onPress={() => {
                  setPublishMenuVisible(false);
                  openPublishStory();
                }}
              >
                <View style={[styles.publishOptionIconBg, { backgroundColor: colors.secondary }]}>
                  <Icon name="flash" size={24} color={colors.white} />
                </View>
                <Text style={styles.publishOptionLabel}>Créer une Story ✨</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.publishOptionItem} 
                onPress={() => {
                  setPublishMenuVisible(false);
                  openEditProfile();
                }}
              >
                <View style={[styles.publishOptionIconBg, { backgroundColor: colors.surfaceLight }]}>
                  <Icon name="person" size={24} color={colors.white} />
                </View>
                <Text style={styles.publishOptionLabel}>Modifier le profil 👤</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.cancelPublishBtn} 
              onPress={() => setPublishMenuVisible(false)}
            >
              <Text style={styles.cancelPublishText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  // QR Code Styles
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModalContent: {
    width: width * 0.85,
    backgroundColor: '#1E152E',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  qrModalTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  qrCard: {
    backgroundColor: '#150C25',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  qrName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  qrUsername: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 24,
  },
  qrGridContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F081D',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  qrGrid: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrAvatarWrapper: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#0F081D',
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  qrAvatarImage: {
    width: '100%',
    height: '100%',
  },
  qrHelpText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  qrShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    width: '100%',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    marginTop: 24,
  },
  qrShareBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  // Bio Container Styles
  bioContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginVertical: 12,
    width: '100%',
  },
  bioText: {
    color: colors.white,
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 6,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  clickableLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
    textDecorationLine: 'underline',
  },
  briefTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  briefText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },

  // Edit profile upload buttons style
  uploadImageButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  uploadImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  uploadImageBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },

  // Video Preview styles
  previewVideoWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: colors.black,
  },
  previewRightActions: {
    position: 'absolute',
    bottom: 80,
    right: 12,
    alignItems: 'center',
    gap: 14,
    zIndex: 10,
  },
  previewActionBtn: {
    alignItems: 'center',
  },
  previewActionIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewActionCount: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  previewBottomMetadata: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 76,
    zIndex: 10,
  },
  previewUserTag: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  previewVideoDesc: {
    color: colors.white,
    fontSize: 13.5,
    lineHeight: 18,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  previewSongContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewSongText: {
    color: colors.white,
    fontSize: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Custom publish options menu styles
  publishMenuContent: {
    backgroundColor: '#1E152E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  publishMenuHeader: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  headerBar: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    marginBottom: 16,
  },
  publishMenuTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  publishMenuSubtitle: {
    color: colors.textSecondary,
    fontSize: 12.5,
    textAlign: 'center',
  },
  publishOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 24,
    gap: 12,
  },
  publishOptionItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  publishOptionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  publishOptionLabel: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  cancelPublishBtn: {
    backgroundColor: colors.surface,
    width: '100%',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cancelPublishText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14.5,
  },
});

export default ProfileScreen;
