import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';
import { sampleVideos, VideoItem } from '../services/CloudinaryService';

const { width, height } = Dimensions.get('window');

interface StoryItem {
  id: string;
  name: string;
  avatar: string;
  hasStory: boolean;
  isSelf?: boolean;
}

const FriendsScreen = () => {
  const { user, likedIds, toggleLike: toggleLikeContext, bookmarkedIds, toggleBookmark, setIsCameraOpen, setCameraMode } = useAuth();
  const [friendsFeed, setFriendsFeed] = useState<VideoItem[]>(sampleVideos.slice(1, 3)); // show a couple videos for friends
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveVideoIndex(viewableItems[0].index);
    }
  }).current;

  // Horizontal Stories Data
  const stories: StoryItem[] = [
    {
      id: 'self',
      name: 'Créer',
      avatar: user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      hasStory: false,
      isSelf: true,
    },
    {
      id: 'friend-1',
      name: 'Lpb C💋',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      hasStory: true,
    },
    {
      id: 'friend-2',
      name: 'Lemougou ...',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      hasStory: true,
    },
    {
      id: 'friend-3',
      name: 'Daïsy✝️💜',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      hasStory: false,
    },
  ];

  const toggleLike = (id: string) => {
    toggleLikeContext(id);
    setFriendsFeed(prev =>
      prev.map(item => {
        if (item.id === id) {
          const isLiked = !likedIds.includes(id);
          return {
            ...item,
            likes: isLiked ? item.likes + 1 : item.likes - 1,
          };
        }
        return item;
      })
    );
  };

  const handleBookmark = (id: string) => {
    toggleBookmark(id);
    setFriendsFeed(prev =>
      prev.map(item => {
        if (item.id === id) {
          const isBookmarked = !bookmarkedIds.includes(id);
          return {
            ...item,
            bookmarks: isBookmarked ? item.bookmarks + 1 : item.bookmarks - 1,
          };
        }
        return item;
      })
    );
  };

  const renderStoryItem = (item: StoryItem) => {
    return (
      <TouchableOpacity 
        key={item.id} 
        style={styles.storyContainer}
        onPress={() => {
          if (item.isSelf) {
            setCameraMode('story');
            setIsCameraOpen(true);
          } else {
            Alert.alert('Story', `Visualisation de la story de ${item.name} bientôt disponible ! 🌟`);
          }
        }}
      >
        <View style={styles.avatarWrapper}>
          {item.hasStory ? (
            // Glowing border for active stories
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.storyBorder}
            >
              <Image source={{ uri: item.avatar }} style={styles.storyAvatar} />
            </LinearGradient>
          ) : (
            <View style={styles.noStoryBorder}>
              <Image source={{ uri: item.avatar }} style={styles.storyAvatar} />
            </View>
          )}
          
          {/* Overlay button logic */}
          {item.isSelf && (
            <View style={styles.addStoryBadge}>
              <Icon name="add" size={12} color={colors.white} />
            </View>
          )}
          
          {!item.isSelf && !item.hasStory && (
            <View style={styles.addFriendBadge}>
              <Icon name="person-add" size={10} color={colors.white} />
            </View>
          )}
        </View>
        <Text style={styles.storyName} numberOfLines={1}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFeedItem = ({ item, index }: { item: VideoItem; index: number }) => {
    const isPlaying = index === activeVideoIndex;
    
    return (
      <View style={styles.feedItemContainer}>
        {/* Friend Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            <Image source={{ uri: item.userAvatar }} style={styles.userAvatar} />
            <View style={styles.userText}>
              <Text style={styles.usernameText}>{item.username}</Text>
              <Text style={styles.timeText}>Il y a 2 h</Text>
            </View>
          </View>
          <TouchableOpacity>
            <Icon name="ellipsis-horizontal" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Video Player */}
        <View style={styles.videoWrapper}>
          <Video
            source={{ uri: item.videoUrl }}
            style={styles.video}
            resizeMode="cover"
            repeat={true}
            paused={!isPlaying}
            muted={true} // start muted to follow mobile autoplays rules
            playInBackground={false}
            playWhenInactive={false}
            onError={(e) => console.log('Friends video playback error:', e)}
          />
        </View>

        {/* Post Actions (Likes, Comments, Shares) */}
        <View style={styles.postFooter}>
          <View style={styles.footerActions}>
            <TouchableOpacity onPress={() => toggleLike(item.id)} style={styles.footerActionBtn}>
              <Icon 
                name={likedIds.includes(item.id) ? "heart" : "heart-outline"} 
                size={26} 
                color={likedIds.includes(item.id) ? colors.error : colors.text} 
              />
              <Text style={styles.footerActionText}>{item.likes}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.footerActionBtn}>
              <Icon name="chatbubble-outline" size={24} color={colors.text} />
              <Text style={styles.footerActionText}>{item.commentsCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleBookmark(item.id)} style={styles.footerActionBtn}>
              <Icon 
                name={bookmarkedIds.includes(item.id) ? "bookmark" : "bookmark-outline"} 
                size={24} 
                color={bookmarkedIds.includes(item.id) ? colors.accent : colors.text} 
              />
              <Text style={styles.footerActionText}>{item.bookmarks}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.footerActionBtn}>
              <Icon name="share-social-outline" size={24} color={colors.text} />
              <Text style={styles.footerActionText}>{item.shares}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.postDescription} numberOfLines={2}>
            <Text style={styles.descriptionUser}>{item.username} </Text>
            {item.description}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navbar */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Ami(e)s</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Icon name="search" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={friendsFeed}
        keyExtractor={item => item.id}
        renderItem={renderFeedItem}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.storiesContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesScroll}
            >
              {stories.map(renderStoryItem)}
            </ScrollView>
            <View style={styles.divider} />
          </View>
        }
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerSpacer: {
    width: 24,
  },
  headerTitle: {
    ...typography.h2,
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  searchButton: {
    padding: 4,
  },
  storiesContainer: {
    backgroundColor: colors.background,
  },
  storiesScroll: {
    paddingLeft: 16,
    paddingVertical: 12,
  },
  storyContainer: {
    alignItems: 'center',
    marginRight: 16,
    width: 76,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 6,
  },
  storyBorder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noStoryBorder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyAvatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.surface,
  },
  addStoryBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  addFriendBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  storyName: {
    ...typography.caption,
    color: colors.white,
    fontSize: 11,
    textAlign: 'center',
    width: '100%',
  },
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  feedItemContainer: {
    marginBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: colors.surface,
  },
  userText: {
    justifyContent: 'center',
  },
  usernameText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  timeText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  videoWrapper: {
    width: width,
    height: height * 0.45,
    backgroundColor: colors.black,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  postFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 20,
  },
  footerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerActionText: {
    color: colors.white,
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
  postDescription: {
    color: colors.white,
    fontSize: 13,
    lineHeight: 18,
  },
  descriptionUser: {
    fontWeight: '600',
  },
});

export default FriendsScreen;
