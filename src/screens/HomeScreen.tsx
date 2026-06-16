import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  Share,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
  ToastAndroid,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import Clipboard from '@react-native-clipboard/clipboard';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { sampleVideos, VideoItem } from '../services/CloudinaryService';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

// Hook to handle rotation animation of the vinyl disc
const RotatingDisc = ({ isPlaying }: { isPlaying: boolean }) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    if (isPlaying) {
      animation = Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );
      animation.start();
    }
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [isPlaying]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.discContainer, { transform: [{ rotate: rotateInterpolate }] }]}>
      <LinearGradientBorder>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' }}
          style={styles.discImage}
        />
      </LinearGradientBorder>
    </Animated.View>
  );
};

// Helper component for simple circular border
const LinearGradientBorder: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.borderWrapper}>
    <View style={styles.innerBorder}>
      {children}
    </View>
  </View>
);

const HomeScreen = () => {
  const { likedIds, bookmarkedIds, toggleLike, toggleBookmark, setIsCameraOpen } = useAuth();
  const [videoFeed, setVideoFeed] = useState<VideoItem[]>(sampleVideos);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [selectedTopTab, setSelectedTopTab] = useState<'pour_toi' | 'suivis' | 'explorer'>('pour_toi');
  
  // Comments Modal State
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, { id: string; user: string; text: string; time: string; avatar: string }[]>>({
    'vid-1': [
      { id: 'c1', user: 'jean_d', text: 'Super conseils, merci docteur ! 🧑‍⚕️', time: '1h', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' },
      { id: 'c2', user: 'amelie_l', text: 'Très instructif, je partage !', time: '4h', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    ],
    'vid-2': [
      { id: 'c3', user: 'nature_lover', text: 'Ces paysages sont incroyables 🌲🚗', time: '2h', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100' },
    ],
  });
  const [newCommentText, setNewCommentText] = useState('');
  
  // Share Modal State
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedShareVideo, setSelectedShareVideo] = useState<VideoItem | null>(null);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveVideoIndex(viewableItems[0].index);
    }
  }).current;

  const handleLike = (videoId: string) => {
    toggleLike(videoId);
    setVideoFeed(prev =>
      prev.map(item => {
        if (item.id === videoId) {
          const isLiked = !likedIds.includes(videoId);
          return {
            ...item,
            likes: isLiked ? item.likes + 1 : item.likes - 1,
          };
        }
        return item;
      })
    );
  };

  const handleBookmark = (videoId: string) => {
    toggleBookmark(videoId);
    setVideoFeed(prev =>
      prev.map(item => {
        if (item.id === videoId) {
          const isBookmarked = !bookmarkedIds.includes(videoId);
          return {
            ...item,
            bookmarks: isBookmarked ? item.bookmarks + 1 : item.bookmarks - 1,
          };
        }
        return item;
      })
    );
  };

  const handleFollow = (videoId: string) => {
    setVideoFeed(prev =>
      prev.map(item => {
        if (item.id === videoId) {
          return {
            ...item,
            isFollowed: true,
          };
        }
        return item;
      })
    );
  };

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('', message);
    }
  };

  const openShareMenu = (item: VideoItem) => {
    setSelectedShareVideo(item);
    setShareModalVisible(true);
  };

  const handleCopyLink = () => {
    if (!selectedShareVideo) return;
    Clipboard.setString(selectedShareVideo.videoUrl);
    setShareModalVisible(false);
    showToast('Lien copié dans le presse-papiers !');
  };

  const handleShareNatively = async () => {
    if (!selectedShareVideo) return;
    setShareModalVisible(false);
    try {
      await Share.share({
        message: `Regarde cette superbe vidéo de @${selectedShareVideo.username} sur StreamSky ! : ${selectedShareVideo.videoUrl}`,
      });
      // Increment share count locally
      setVideoFeed(prev =>
        prev.map(v => (v.id === selectedShareVideo.id ? { ...v, shares: v.shares + 1 } : v))
      );
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleRepublish = () => {
    if (!selectedShareVideo) return;
    setShareModalVisible(false);
    setVideoFeed(prev =>
      prev.map(v => (v.id === selectedShareVideo.id ? { ...v, shares: v.shares + 1 } : v))
    );
    showToast('Vidéo republiée avec succès ! 🔄');
  };

  const handleSaveVideo = () => {
    if (!selectedShareVideo) return;
    setShareModalVisible(false);
    showToast('Téléchargement de la vidéo commencé...');
    setTimeout(() => {
      showToast('Vidéo enregistrée dans la galerie ! 📥');
    }, 2000);
  };

  const handleDuet = () => {
    setShareModalVisible(false);
    Alert.alert('Fonction Duo', 'La fonctionnalité Duo sera bientôt disponible ! 🚀');
  };

  const handleNotInterested = () => {
    if (!selectedShareVideo) return;
    setShareModalVisible(false);
    showToast('Cette vidéo ne vous sera plus recommandée.');
  };

  const handleReport = () => {
    if (!selectedShareVideo) return;
    setShareModalVisible(false);
    Alert.alert(
      'Signaler',
      'Merci de nous aider à préserver la sécurité de la communauté StreamSky. Voulez-vous signaler cette vidéo ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Signaler', style: 'destructive', onPress: () => showToast('Vidéo signalée avec succès.') },
      ]
    );
  };

  const openComments = (videoId: string) => {
    setCurrentVideoId(videoId);
    setCommentsModalVisible(true);
  };

  const postComment = () => {
    if (!newCommentText.trim() || !currentVideoId) return;

    const newComment = {
      id: Math.random().toString(36).substr(2, 9),
      user: 'moi',
      text: newCommentText.trim(),
      time: 'Maintenant',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    };

    setCommentsMap(prev => ({
      ...prev,
      [currentVideoId]: [newComment, ...(prev[currentVideoId] || [])],
    }));

    // Update comment count on video
    setVideoFeed(prev =>
      prev.map(v => (v.id === currentVideoId ? { ...v, commentsCount: v.commentsCount + 1 } : v))
    );

    setNewCommentText('');
  };

  // Double tap to like implementation
  const lastTapRef = useRef(0);
  const handleDoubleTap = (videoId: string) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      const isLiked = likedIds.includes(videoId);
      if (!isLiked) {
        handleLike(videoId);
      }
    } else {
      lastTapRef.current = now;
    }
  };

  const renderVideoItem = ({ item, index }: { item: VideoItem; index: number }) => {
    const isPlaying = index === activeVideoIndex;
    const commentsList = (currentVideoId && commentsMap[currentVideoId]) || [];
    const isLiked = likedIds.includes(item.id);
    const isBookmarked = bookmarkedIds.includes(item.id);

    return (
      <View style={styles.videoContainer}>
        {/* Fullscreen Video Player */}
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          onPress={() => handleDoubleTap(item.id)}
        >
          <Video
            source={{ uri: item.videoUrl }}
            style={styles.videoPlayer}
            resizeMode="cover"
            repeat={true}
            paused={!isPlaying}
            muted={false}
            playInBackground={false}
            playWhenInactive={false}
            onError={(e) => console.log('Video Playback Error:', e)}
          />
        </TouchableOpacity>

        {/* Dynamic Overlay info */}
        <View style={styles.overlayContainer}>
          {/* Bottom Video Metadata */}
          <View style={styles.bottomMetadata}>
            <Text style={styles.userTag}>@{item.username}</Text>
            <Text style={styles.videoDesc} numberOfLines={3}>
              {item.description}
            </Text>
            <View style={styles.songContainer}>
              <Icon name="musical-notes" size={16} color={colors.white} style={styles.musicIcon} />
              <Text style={styles.songText} numberOfLines={1}>
                {item.songName}
              </Text>
            </View>
          </View>

          {/* Right Action Buttons */}
          <View style={styles.rightActions}>
            {/* User Profile Avatar with dynamic Follow button */}
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={() => handleFollow(item.id)}>
                <Image source={{ uri: item.userAvatar }} style={styles.avatarImg as any} />
              </TouchableOpacity>
              {!item.isFollowed && (
                <TouchableOpacity style={styles.followBadge} onPress={() => handleFollow(item.id)}>
                  <Icon name="add" size={12} color={colors.white} />
                </TouchableOpacity>
              )}
            </View>

            {/* Like (Heart) */}
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item.id)}>
              <View style={styles.actionIconWrapper}>
                <Icon
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={36}
                  color={isLiked ? colors.error : colors.white}
                />
              </View>
              <Text style={styles.actionCount}>{item.likes}</Text>
            </TouchableOpacity>

            {/* Comments */}
            <TouchableOpacity style={styles.actionBtn} onPress={() => openComments(item.id)}>
              <View style={styles.actionIconWrapper}>
                <Icon name="chatbubble-ellipses" size={34} color={colors.white} />
              </View>
              <Text style={styles.actionCount}>{item.commentsCount}</Text>
            </TouchableOpacity>

            {/* Bookmarks */}
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleBookmark(item.id)}>
              <View style={styles.actionIconWrapper}>
                <Icon
                  name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={32}
                  color={isBookmarked ? colors.accent : colors.white}
                />
              </View>
              <Text style={styles.actionCount}>{item.bookmarks}</Text>
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity style={styles.actionBtn} onPress={() => openShareMenu(item)}>
              <View style={styles.actionIconWrapper}>
                <Icon name="share-social" size={32} color={colors.white} />
              </View>
              <Text style={styles.actionCount}>{item.shares}</Text>
            </TouchableOpacity>

            {/* Rotating Disc */}
            <RotatingDisc isPlaying={isPlaying} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header Navigation Overlay */}
      <SafeAreaView style={styles.topHeader}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => setIsCameraOpen(true)}>
          <Icon name="videocam-outline" size={26} color={colors.white} />
        </TouchableOpacity>

        {/* Scroll Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity onPress={() => setSelectedTopTab('explorer')} style={styles.tabBtn}>
            <Text style={[styles.tabText, selectedTopTab === 'explorer' && styles.tabTextActive]}>
              Explorer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedTopTab('suivis')} style={styles.tabBtn}>
            <Text style={[styles.tabText, selectedTopTab === 'suivis' && styles.tabTextActive]}>
              Suivis
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedTopTab('pour_toi')} style={styles.tabBtn}>
            <Text style={[styles.tabText, selectedTopTab === 'pour_toi' && styles.tabTextActive]}>
              Pour toi
            </Text>
            {selectedTopTab === 'pour_toi' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.headerIcon}>
          <Icon name="search" size={24} color={colors.white} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Video Feed */}
      <FlatList
        data={videoFeed}
        keyExtractor={item => item.id}
        renderItem={renderVideoItem}
        pagingEnabled={true}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews={true}
      />

      {/* Bottom Sheet Comments Modal */}
      <Modal
        visible={commentsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCommentsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.commentsSheet}>
            {/* Modal Header */}
            <View style={styles.commentsHeader}>
              <View style={styles.headerBar} />
              <View style={styles.commentsHeaderTitleRow}>
                <Text style={styles.commentsCountTitle}>
                  {currentVideoId ? `${commentsMap[currentVideoId]?.length || 0} commentaires` : '0 commentaires'}
                </Text>
                <TouchableOpacity onPress={() => setCommentsModalVisible(false)} style={styles.closeModalBtn}>
                  <Icon name="close" size={24} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Comments List */}
            <FlatList
              data={currentVideoId ? commentsMap[currentVideoId] || [] : []}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.commentsListContent}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Image source={{ uri: item.avatar }} style={styles.commentAvatar as any} />
                  <View style={styles.commentDetails}>
                    <Text style={styles.commentUser}>{item.user}</Text>
                    <Text style={styles.commentText}>{item.text}</Text>
                    <Text style={styles.commentTime}>{item.time}</Text>
                  </View>
                  <TouchableOpacity style={styles.commentLikeBtn}>
                    <Icon name="heart-outline" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyComments}>
                  <Text style={styles.emptyCommentsText}>Aucun commentaire pour l'instant.</Text>
                  <Text style={styles.emptyCommentsSub}>Soyez le premier à commenter !</Text>
                </View>
              }
            />

            {/* Comment Input */}
            <View style={styles.commentInputRow}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' }}
                style={styles.commentInputAvatar as any}
              />
              <TextInput
                style={styles.commentTextInput}
                placeholder="Ajouter un commentaire..."
                placeholderTextColor={colors.textSecondary}
                value={newCommentText}
                onChangeText={setNewCommentText}
              />
              <TouchableOpacity onPress={postComment} style={styles.publishBtn}>
                <Icon name="paper-plane" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bottom Sheet Share Modal */}
      <Modal
        visible={shareModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShareModalVisible(false)}
        >
          <View style={styles.shareSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.shareHeader}>
              <View style={styles.headerBar} />
              <Text style={styles.shareTitle}>Partager la vidéo</Text>
            </View>

            {/* Row 1: Quick share/copy */}
            <View style={styles.shareActionsContainer}>
              <Text style={styles.shareSectionTitle}>Partager avec</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollActions}>
                <TouchableOpacity style={styles.shareActionItem} onPress={handleShareNatively}>
                  <View style={[styles.shareActionIconWrapper, { backgroundColor: '#25D366' }]}>
                    <Icon name="logo-whatsapp" size={24} color={colors.white} />
                  </View>
                  <Text style={styles.shareActionLabel}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareActionItem} onPress={handleShareNatively}>
                  <View style={[styles.shareActionIconWrapper, { backgroundColor: '#1877F2' }]}>
                    <Icon name="logo-facebook" size={24} color={colors.white} />
                  </View>
                  <Text style={styles.shareActionLabel}>Facebook</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareActionItem} onPress={handleCopyLink}>
                  <View style={[styles.shareActionIconWrapper, { backgroundColor: colors.surface }]}>
                    <Icon name="link" size={24} color={colors.white} />
                  </View>
                  <Text style={styles.shareActionLabel}>Copier le lien</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareActionItem} onPress={handleRepublish}>
                  <View style={[styles.shareActionIconWrapper, { backgroundColor: '#00F2FE' }]}>
                    <Icon name="repeat" size={24} color={colors.black} />
                  </View>
                  <Text style={styles.shareActionLabel}>Republier</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareActionItem} onPress={handleSaveVideo}>
                  <View style={[styles.shareActionIconWrapper, { backgroundColor: colors.surface }]}>
                    <Icon name="download-outline" size={24} color={colors.white} />
                  </View>
                  <Text style={styles.shareActionLabel}>Enregistrer</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Row 2: TikTok features */}
            <View style={styles.shareActionsContainer}>
              <Text style={styles.shareSectionTitle}>Autres fonctionnalités</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollActions}>
                <TouchableOpacity style={styles.shareActionItem} onPress={handleDuet}>
                  <View style={[styles.shareActionIconWrapper, { backgroundColor: colors.surface }]}>
                    <Icon name="duplicate-outline" size={24} color={colors.white} />
                  </View>
                  <Text style={styles.shareActionLabel}>Duo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareActionItem} onPress={handleNotInterested}>
                  <View style={[styles.shareActionIconWrapper, { backgroundColor: colors.surface }]}>
                    <Icon name="eye-off-outline" size={24} color={colors.white} />
                  </View>
                  <Text style={styles.shareActionLabel}>Pas intéressé</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareActionItem} onPress={handleReport}>
                  <View style={[styles.shareActionIconWrapper, { backgroundColor: colors.surface }]}>
                    <Icon name="flag-outline" size={24} color={colors.white} />
                  </View>
                  <Text style={styles.shareActionLabel}>Signaler</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <TouchableOpacity style={styles.cancelShareBtn} onPress={() => setShareModalVisible(false)}>
              <Text style={styles.cancelShareText}>Annuler</Text>
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
    backgroundColor: colors.black,
  },
  topHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 10,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 100,
  },
  headerIcon: {
    padding: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    flex: 1,
  },
  tabBtn: {
    paddingVertical: 8,
    position: 'relative',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tabTextActive: {
    color: colors.white,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 2,
    alignSelf: 'center',
    width: 24,
    height: 3,
    backgroundColor: colors.white,
    borderRadius: 1.5,
  },
  videoContainer: {
    width: width,
    height: height - 60, // Subtract bottom navigator height
    backgroundColor: colors.black,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bottomMetadata: {
    flex: 1,
    marginRight: 16,
    justifyContent: 'flex-end',
  },
  userTag: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  videoDesc: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  songContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  musicIcon: {
    marginRight: 6,
  },
  songText: {
    color: colors.white,
    fontSize: 13,
    width: width * 0.5,
  },
  rightActions: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 60,
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: colors.white,
    backgroundColor: colors.surface,
  },
  followBadge: {
    position: 'absolute',
    bottom: -5,
    alignSelf: 'center',
    backgroundColor: colors.error, // Red plus follow button
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.black,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionIconWrapper: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  actionCount: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  discContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  borderWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 8,
    borderColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerBorder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  discImage: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  commentsSheet: {
    height: height * 0.65,
    backgroundColor: '#1E152E',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
  },
  commentsHeader: {
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerBar: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginBottom: 10,
  },
  commentsHeaderTitleRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  commentsCountTitle: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
    flex: 1,
  },
  closeModalBtn: {
    padding: 4,
  },
  commentsListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 12,
    backgroundColor: colors.surface,
  },
  commentDetails: {
    flex: 1,
  },
  commentUser: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  commentText: {
    color: colors.white,
    fontSize: 13.5,
    lineHeight: 18,
    marginBottom: 4,
  },
  commentTime: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
  },
  commentLikeBtn: {
    padding: 4,
    alignSelf: 'center',
  },
  emptyComments: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyCommentsText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyCommentsSub: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#1E152E',
  },
  commentInputAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 12,
  },
  commentTextInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    paddingHorizontal: 16,
    color: colors.white,
    fontSize: 13.5,
  },
  publishBtn: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareSheet: {
    height: height * 0.42,
    backgroundColor: '#1E152E',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
  },
  shareHeader: {
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  shareTitle: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  shareActionsContainer: {
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  shareSectionTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  scrollActions: {
    paddingHorizontal: 10,
    gap: 14,
  },
  shareActionItem: {
    alignItems: 'center',
    width: 68,
  },
  shareActionIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  shareActionLabel: {
    color: colors.white,
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  cancelShareBtn: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginTop: 'auto',
  },
  cancelShareText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default HomeScreen;
