import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView,
  Alert,
  Share,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';
import { supabaseService } from '../services/SupabaseService';
import { sampleVideos, VideoItem, supabaseVideoToItem } from '../services/CloudinaryService';

const { width, height } = Dimensions.get('window');

interface Message {
  id: string;
  senderId: string;
  text: string;
  time: string;
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  online: boolean;
  messages: Message[];
  isFollowNotification?: boolean;
  isFollowedBack?: boolean;
  senderId?: string;
}

const MessagesScreen = () => {
  const { user, logout, setIsCameraOpen, setCameraMode, bookmarkedIds, likedIds, toggleBookmark, toggleLike } = useAuth();
  const isGuest = user?.isGuest ?? true;

  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [inputText, setInputText] = useState('');

  // Visited profile states
  const [visitedUser, setVisitedUser] = useState<any | null>(null);
  const [visitedUserVideos, setVisitedUserVideos] = useState<VideoItem[]>([]);
  const [visitedUserIsFollowing, setVisitedUserIsFollowing] = useState(false);
  const [visitedUserModalVisible, setVisitedUserModalVisible] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<VideoItem | null>(null);

  const getCloudinaryThumbnail = (videoUrl: string) => {
    try {
      if (videoUrl.includes('/video/upload/') && videoUrl.includes('.m3u8')) {
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

  const loadMessagesAndNotifications = useCallback(async (isRefresh = false) => {
    if (isGuest) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      // 1. Fetch notifications (follows)
      const dbNotifs = await supabaseService.fetchNotifications();
      const followNotifs = dbNotifs.filter(n => n.type === 'follow');
      
      const followsPromises = followNotifs.map(n => supabaseService.checkIfFollowing(n.sender_id));
      const followsResults = await Promise.all(followsPromises);

      const notifChats: Chat[] = followNotifs.map((n, idx) => ({
        id: n.id,
        name: n.sender_name || 'Abonné StreamSky',
        avatar: n.sender_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        lastMessage: 'S\'est abonné(e) à votre compte.',
        time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unreadCount: n.is_read ? 0 : 1,
        online: false,
        isFollowNotification: true,
        isFollowedBack: followsResults[idx],
        senderId: n.sender_id,
        messages: [
          {
            id: n.id,
            senderId: n.sender_id,
            text: `Bonjour ! Je m'appelle ${n.sender_name || 'un abonné'} et je viens de m'abonner à votre compte StreamSky. J'adore vos vidéos ! 🎬✨`,
            time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]
      }));

      // 2. Fetch direct messages
      const dbMsgs = await supabaseService.fetchDirectMessages();
      const currentUserId = supabaseService.getFirebaseUid();
      const chatsMap: Record<string, Message[]> = {};
      
      dbMsgs.forEach((m) => {
        const otherUserId = m.sender_id === currentUserId ? m.recipient_id : m.sender_id;
        if (!chatsMap[otherUserId]) {
          chatsMap[otherUserId] = [];
        }
        chatsMap[otherUserId].push({
          id: m.id,
          senderId: m.sender_id === currentUserId ? 'me' : 'them',
          text: m.text,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      });

      const allVideos = await supabaseService.fetchVideos();
      const userDetailsMap: Record<string, { name: string; avatar: string }> = {};
      allVideos.forEach(v => {
        if (v.user_id && !userDetailsMap[v.user_id]) {
          userDetailsMap[v.user_id] = {
            name: v.display_name || `user_${v.user_id.substring(0, 8)}`,
            avatar: v.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          };
        }
      });

      const dmChats: Chat[] = Object.keys(chatsMap).map(otherId => {
        const msgs = chatsMap[otherId];
        const lastMsg = msgs[msgs.length - 1];
        const details = userDetailsMap[otherId] || {
          name: `user_${otherId.substring(0, 8)}`,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        };
        
        return {
          id: `chat-${otherId}`,
          name: details.name,
          avatar: details.avatar,
          lastMessage: lastMsg.text,
          time: lastMsg.time,
          unreadCount: 0,
          online: false,
          senderId: otherId,
          messages: msgs,
        };
      });

      setChats([...notifChats, ...dmChats]);
    } catch (e) {
      console.warn('[MessagesScreen] Erreur lors du chargement des messages:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isGuest]);

  useEffect(() => {
    loadMessagesAndNotifications();
  }, [loadMessagesAndNotifications]);

  // Handle opening a chat
  const handleOpenChat = (chat: Chat) => {
    if (isGuest) {
      Alert.alert(
        'Connexion requise',
        'Veuillez vous connecter ou vous inscrire pour envoyer des messages à vos amis.',
        [{ text: 'Compris' }]
      );
      return;
    }

    setSelectedChat(chat);
    setChatModalVisible(true);

    // Reset unread count
    setChats((prev) =>
      prev.map((c) => (c.id === chat.id ? { ...c, unreadCount: 0 } : c))
    );
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedChat || !selectedChat.senderId) return;
    const text = inputText.trim();
    setInputText('');

    try {
      await supabaseService.sendDirectMessage(selectedChat.senderId, text);
      loadMessagesAndNotifications();
    } catch (e) {
      console.warn('[MessagesScreen] Erreur envoi message:', e);
    }
  };

  const handleFollowBack = async (chat: Chat) => {
    if (!chat.senderId) return;
    try {
      const success = await supabaseService.followUser(chat.senderId);
      if (success) {
        setChats(prev => prev.map(c => c.senderId === chat.senderId ? { ...c, isFollowedBack: true } : c));
        setVisitedUserIsFollowing(true);
        Alert.alert('Succès', `Vous suivez maintenant ${chat.name} ! 🎉`);
      }
    } catch (e) {
      console.warn('[MessagesScreen] Erreur abonnement en retour:', e);
    }
  };

  const openVisitedUserProfile = async (chat: Chat) => {
    if (!chat.senderId) return;
    try {
      setVisitedUser({
        uid: chat.senderId,
        displayName: chat.name,
        photoURL: chat.avatar,
        bio: 'Créateur de contenu StreamSky 🚀 Camerounais et fier ! ✨',
      });
      
      const isFollowing = await supabaseService.checkIfFollowing(chat.senderId);
      setVisitedUserIsFollowing(isFollowing);
      
      const allVideos = await supabaseService.fetchVideos();
      const userVideos = allVideos
        .filter(v => v.user_id === chat.senderId)
        .map(supabaseVideoToItem);
      
      if (userVideos.length === 0) {
        const seeded = sampleVideos.map(v => ({
          ...v,
          username: chat.name.toLowerCase().replace(/\s+/g, '_').replace('@', ''),
          userId: chat.senderId,
          views: Math.floor(Math.random() * 800) + 150
        }));
        setVisitedUserVideos(seeded);
      } else {
        setVisitedUserVideos(userVideos);
      }
      
      setVisitedUserModalVisible(true);
    } catch (e) {
      console.warn('[MessagesScreen] Erreur ouverture profil visiteur:', e);
    }
  };

  // Filter chats by search
  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isGuest) {
    return (
      <SafeAreaView style={styles.guestContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image 
              source={require('../../asset/logo StreamSky.png')} 
              style={styles.headerLogoSmall} 
              resizeMode="contain"
            />
            <Text style={[styles.headerTitle, { marginLeft: 8 }]}>Messages</Text>
          </View>
        </View>

        {/* Empty Inbox for Guest */}
        <View style={styles.emptyInbox}>
          <View style={styles.chatIconWrapper}>
            <Image 
              source={require('../../asset/logo StreamSky.png')} 
              style={styles.guestLogoLarge} 
              resizeMode="contain"
            />
          </View>
          <Text style={styles.emptyInboxTitle}>Vos messages</Text>
          <Text style={styles.emptySubtitle}>
            Les messages envoyés à vos amis s'affichent ici. Connectez-vous pour commencer à discuter.
          </Text>
          <TouchableOpacity style={styles.inboxButton} onPress={logout}>
            <Text style={styles.inboxButtonText}>Se connecter / S'inscrire</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image 
            source={require('../../asset/logo StreamSky.png')} 
            style={styles.headerLogoSmall} 
            resizeMode="contain"
          />
          <Text style={[styles.headerTitle, { marginLeft: 8 }]}>Messages</Text>
        </View>
        <TouchableOpacity style={styles.newChatBtn} onPress={() => {
          if (isGuest) {
            Alert.alert('Connexion requise', 'Connectez-vous pour démarrer un nouveau chat.');
          } else {
            Alert.alert('Nouveau message', 'Recherchez un ami pour démarrer une conversation.');
          }
        }}>
          <Icon name="create-outline" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={18} color="rgba(255, 255, 255, 0.4)" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher des amis ou des messages..."
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Online friends list (Horizontal) */}
      <View style={styles.activeSection}>
        <Text style={styles.sectionTitle}>En ligne ({chats.filter(c => c.online).length})</Text>
        <FlatList
          horizontal
          data={[
            {
              id: 'self',
              name: 'Votre Story',
              avatar: user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
              isSelf: true,
              online: false,
            } as any,
            ...chats.filter(c => c.online),
          ]}
          keyExtractor={(item) => `online-${item.id}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.onlineList}
          renderItem={({ item }) => {
            if ('isSelf' in item && item.isSelf) {
              return (
                <TouchableOpacity
                  style={styles.onlineUser}
                  onPress={() => {
                    setCameraMode('story');
                    setIsCameraOpen(true);
                  }}
                >
                  <View style={styles.avatarWrapper}>
                    <Image source={{ uri: item.avatar }} style={styles.onlineAvatar} />
                    <View style={styles.selfStoryBadge}>
                      <Icon name="add" size={10} color={colors.white} />
                    </View>
                  </View>
                  <Text style={styles.onlineName} numberOfLines={1}>
                    Votre Story
                  </Text>
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity style={styles.onlineUser} onPress={() => handleOpenChat(item as Chat)}>
                <View style={styles.avatarWrapper}>
                  <Image source={{ uri: item.avatar }} style={styles.onlineAvatar} />
                  {item.online && <View style={styles.onlineBadge} />}
                </View>
                <Text style={styles.onlineName} numberOfLines={1}>
                  {item.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatList}
        renderItem={({ item }) => {
          if (item.isFollowNotification) {
            return (
              <View style={styles.chatItem}>
                <TouchableOpacity onPress={() => openVisitedUserProfile(item)}>
                  <View style={styles.avatarWrapper}>
                    <Image source={{ uri: item.avatar }} style={styles.chatAvatar} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.chatDetails} 
                  onPress={() => openVisitedUserProfile(item)}
                >
                  <View style={styles.chatHeaderRow}>
                    <Text style={styles.chatName}>{item.name}</Text>
                    <Text style={styles.chatTime}>{item.time}</Text>
                  </View>
                  <View style={styles.chatMessageRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                      <Text style={[styles.chatMessage, { flex: 0, marginRight: 6 }]} numberOfLines={1}>
                        {item.lastMessage}
                      </Text>
                      <View style={styles.followerBadge}>
                        <Text style={styles.followerBadgeText}>Follower</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.followBackBtn,
                    item.isFollowedBack ? styles.followedBackBtn : styles.notFollowedBackBtn
                  ]}
                  onPress={() => handleFollowBack(item)}
                  disabled={item.isFollowedBack}
                >
                  <Text style={[
                    styles.followBackBtnText,
                    item.isFollowedBack ? styles.followedBackBtnText : styles.notFollowedBackBtnText
                  ]}>
                    {item.isFollowedBack ? 'Suivi' : 'Suivre'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <TouchableOpacity style={styles.chatItem} onPress={() => handleOpenChat(item)}>
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: item.avatar }} style={styles.chatAvatar} />
                {item.online && <View style={styles.onlineBadge} />}
              </View>

              <View style={styles.chatDetails}>
                <View style={styles.chatHeaderRow}>
                  <Text style={styles.chatName}>{item.name}</Text>
                  <Text style={styles.chatTime}>{item.time}</Text>
                </View>
                <View style={styles.chatMessageRow}>
                  <Text style={[styles.chatMessage, item.unreadCount > 0 && styles.unreadMessage]} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                  {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="chatbubbles-outline" size={60} color="rgba(255, 255, 255, 0.15)" />
            <Text style={styles.emptyTitle}>Aucune conversation</Text>
            <Text style={styles.emptySub}>Commencez à discuter avec vos amis en ligne.</Text>
          </View>
        }
      />

      {/* Chat Room Modal */}
      {selectedChat && (
        <Modal
          visible={chatModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setChatModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.chatRoomContainer}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setChatModalVisible(false)} style={styles.backButton}>
                  <Icon name="chevron-back" size={26} color={colors.white} />
                </TouchableOpacity>

                <View style={styles.chatRoomUserInfo}>
                  <Image source={{ uri: selectedChat.avatar }} style={styles.roomAvatar} />
                  <View>
                    <Text style={styles.roomName}>{selectedChat.name}</Text>
                    <Text style={styles.roomStatus}>
                      {selectedChat.online ? 'En ligne' : 'Hors ligne'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.moreButton} onPress={() => Alert.alert('Options', 'Fonctionnalité d\'appel vidéo et de profil bientôt disponible !')}>
                  <Icon name="videocam-outline" size={24} color={colors.white} style={{ marginRight: 16 }} />
                  <Icon name="ellipsis-horizontal" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>

              {/* Messages Flow */}
              <FlatList
                data={selectedChat.messages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesFlow}
                renderItem={({ item }) => {
                  const isMe = item.senderId === 'me';
                  return (
                    <View style={[styles.messageBubbleWrapper, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
                      {!isMe && <Image source={{ uri: selectedChat.avatar }} style={styles.bubbleAvatar} />}
                      <View style={[styles.bubble, isMe ? styles.bubbleColorMe : styles.bubbleColorThem]}>
                        <Text style={styles.bubbleText}>{item.text}</Text>
                        <Text style={styles.bubbleTime}>{item.time}</Text>
                      </View>
                    </View>
                  );
                }}
                ref={(ref) => {
                  // auto scroll to bottom
                  setTimeout(() => ref?.scrollToEnd({ animated: true }), 100);
                }}
              />

              {/* Input Row */}
              <View style={styles.inputRow}>
                <TouchableOpacity 
                  style={styles.inputAddonBtn} 
                  onPress={() => {
                    setChatModalVisible(false);
                    setCameraMode('video');
                    setIsCameraOpen(true);
                  }}
                >
                  <Icon name="camera-outline" size={24} color={colors.white} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.inputAddonBtn} 
                  onPress={() => {
                    setChatModalVisible(false);
                    setCameraMode('video');
                    setIsCameraOpen(true);
                  }}
                >
                  <Icon name="image-outline" size={24} color={colors.white} style={{ marginRight: 8 }} />
                </TouchableOpacity>

                <TextInput
                  style={styles.chatInput}
                  placeholder="Envoyer un message..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={handleSendMessage}
                />

                <TouchableOpacity onPress={handleSendMessage} style={styles.sendBtn} disabled={!inputText.trim()}>
                  <Icon name="paper-plane" size={20} color={inputText.trim() ? colors.primary : 'rgba(255, 255, 255, 0.2)'} />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* Visited User Profile Modal */}
      {visitedUser && (
        <Modal
          visible={visitedUserModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setVisitedUserModalVisible(false)}
        >
          <View style={styles.visitedProfileContainer}>
            {/* Header */}
            <View style={styles.visitedHeader}>
              <TouchableOpacity onPress={() => setVisitedUserModalVisible(false)} style={styles.backButton}>
                <Icon name="chevron-back" size={26} color={colors.white} />
              </TouchableOpacity>
              <Text style={styles.visitedHeaderTitle}>{visitedUser.displayName}</Text>
              <View style={{ width: 26 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Profile Info */}
              <View style={styles.profileInfo}>
                <View style={styles.avatarContainer}>
                  {visitedUser.photoURL ? (
                    <Image source={{ uri: visitedUser.photoURL }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Icon name="person" size={50} color={colors.background} />
                    </View>
                  )}
                </View>
                
                <Text style={styles.username}>@{visitedUser.displayName.toLowerCase().replace(/\s+/g, '_')}</Text>

                {/* Followers / Stats */}
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statCount}>24</Text>
                    <Text style={styles.statLabel}>Abonnements</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statCount}>108</Text>
                    <Text style={styles.statLabel}>Abonnés</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statCount}>
                      {visitedUserVideos.reduce((acc, curr) => acc + (curr.likes || 0), 0) || 542}
                    </Text>
                    <Text style={styles.statLabel}>J'aime</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.visitedActionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.visitedFollowBtn,
                      visitedUserIsFollowing ? styles.visitedFollowBtnActive : styles.visitedFollowBtnInactive
                    ]}
                    onPress={async () => {
                      if (visitedUserIsFollowing) {
                        Alert.alert('Info', `Vous suivez déjà ${visitedUser.displayName}.`);
                      } else {
                        const success = await supabaseService.followUser(visitedUser.uid);
                        if (success) {
                          setVisitedUserIsFollowing(true);
                          setChats(prev => prev.map(c => c.senderId === visitedUser.uid ? { ...c, isFollowedBack: true } : c));
                          Alert.alert('Succès', `Vous suivez maintenant ${visitedUser.displayName} ! 🎉`);
                        }
                      }
                    }}
                  >
                    <Text style={[
                      styles.visitedFollowBtnText,
                      visitedUserIsFollowing ? styles.visitedFollowBtnTextActive : styles.visitedFollowBtnTextInactive
                    ]}>
                      {visitedUserIsFollowing ? 'Suivi' : 'Suivre en retour'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.visitedMessageBtn}
                    onPress={() => {
                      setVisitedUserModalVisible(false);
                      const matchingChat = chats.find(c => c.senderId === visitedUser.uid);
                      if (matchingChat) {
                        handleOpenChat(matchingChat);
                      } else {
                        const newChat: Chat = {
                          id: `chat-${visitedUser.uid}`,
                          name: visitedUser.displayName,
                          avatar: visitedUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                          lastMessage: '',
                          time: '',
                          unreadCount: 0,
                          online: false,
                          senderId: visitedUser.uid,
                          messages: []
                        };
                        handleOpenChat(newChat);
                      }
                    }}
                  >
                    <Text style={styles.visitedMessageBtnText}>Message</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Biography */}
                <View style={styles.bioContainer}>
                  <Text style={styles.bioText}>
                    {visitedUser.bio || 'Aucune biographie rédigée.'}
                  </Text>
                  <View style={styles.briefTextContainer}>
                    <Icon name="sparkles-outline" size={12} color={colors.secondary} style={{ marginRight: 4 }} />
                    <Text style={styles.briefText}>
                      Membre StreamSky vérifié 💫
                    </Text>
                  </View>
                </View>
              </View>

              {/* Tab Grid Title */}
              <View style={styles.tabsContainer}>
                <View style={[styles.tab, styles.activeTab, { flex: 1, paddingVertical: 12 }]}>
                  <Icon name="grid-outline" size={22} color={colors.white} />
                </View>
              </View>

              {/* Video Grid */}
              {visitedUserVideos.length === 0 ? (
                <View style={styles.emptyGridContainer}>
                  <Icon name="videocam" size={48} color="rgba(255, 255, 255, 0.2)" />
                  <Text style={styles.emptyGridText}>Aucune publication</Text>
                  <Text style={styles.emptyGridSub}>Les créations de cet utilisateur s'afficheront ici.</Text>
                </View>
              ) : (
                <View style={styles.gridContainer}>
                  {visitedUserVideos.map((video) => (
                    <TouchableOpacity key={video.id} style={styles.gridItem} onPress={() => setPreviewVideo(video)}>
                      <Image source={{ uri: video.thumbnailUrl || getCloudinaryThumbnail(video.videoUrl) }} style={styles.gridThumbnail} />
                      <View style={styles.gridLikesOverlay}>
                        <Icon name="play-outline" size={12} color={colors.white} style={styles.playIcon} />
                        <Text style={styles.gridLikesText}>
                          {video.views !== undefined && video.views > 0 ? video.views : Math.floor(video.likes * 4.2) + 24}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>
      )}

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.surfaceLight,
  },
  headerTitle: {
    ...typography.h2,
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  newChatBtn: {
    padding: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    fontSize: 14,
    padding: 0,
  },
  activeSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  onlineList: {
    paddingLeft: 16,
    paddingBottom: 8,
  },
  onlineUser: {
    alignItems: 'center',
    marginRight: 20,
    width: 60,
  },
  onlineAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CD964',
    borderWidth: 2,
    borderColor: colors.background,
  },
  onlineName: {
    color: colors.white,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
  },
  chatList: {
    paddingHorizontal: 16,
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  chatAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.surface,
  },
  chatDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  chatTime: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  chatMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatMessage: {
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
    marginRight: 10,
  },
  unreadMessage: {
    color: colors.white,
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: colors.secondary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 4,
  },
  emptySub: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  // Chat Room styles
  modalHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  chatRoomContainer: {
    flex: 1,
    backgroundColor: '#150C25',
  },
  chatRoomUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  roomAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  roomName: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  roomStatus: {
    color: '#4CD964',
    fontSize: 11,
    marginTop: 1,
  },
  backButton: {
    padding: 4,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  messagesFlow: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
  },
  bubbleRight: {
    alignSelf: 'flex-end',
  },
  bubbleAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: 'relative',
  },
  bubbleColorMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  bubbleColorThem: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 2,
  },
  bubbleText: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 19,
  },
  bubbleTime: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1E152E',
  },
  inputAddonBtn: {
    padding: 6,
  },
  chatInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    paddingHorizontal: 16,
    color: colors.white,
    fontSize: 14,
    marginHorizontal: 4,
  },
  sendBtn: {
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerLogoSmall: {
    width: 28,
    height: 28,
  },
  guestLogoLarge: {
    width: 70,
    height: 70,
  },
  emptyInbox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: -40,
  },
  chatIconWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyInboxTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  inboxButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  inboxButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  selfStoryBadge: {
    position: 'absolute',
    bottom: 0,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  followerBadge: {
    backgroundColor: 'rgba(255, 0, 127, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  followerBadgeText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  followBackBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  notFollowedBackBtn: {
    backgroundColor: colors.primary,
  },
  followedBackBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  followBackBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  notFollowedBackBtnText: {
    color: colors.white,
  },
  followedBackBtnText: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  visitedProfileContainer: {
    flex: 1,
    backgroundColor: '#150C25',
  },
  visitedHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#150C25',
  },
  visitedHeaderTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  username: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statCount: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  visitedActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  visitedFollowBtn: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitedFollowBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  visitedFollowBtnInactive: {
    backgroundColor: colors.primary,
  },
  visitedFollowBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  visitedFollowBtnTextActive: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  visitedFollowBtnTextInactive: {
    color: colors.white,
  },
  visitedMessageBtn: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitedMessageBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  bioContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  bioText: {
    color: colors.white,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  briefTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  briefText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: 8,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.white,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 2,
  },
  gridItem: {
    width: (width - 4) / 3,
    height: ((width - 4) / 3) * 1.4,
    padding: 1,
    position: 'relative',
  },
  gridThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  gridLikesOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  playIcon: {
    marginRight: 4,
  },
  gridLikesText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  emptyGridContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
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
  previewOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewVideoWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#000',
  },
  previewVideoPlayer: {
    width: '100%',
    height: '100%',
  },
  previewCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    zIndex: 10,
    padding: 6,
  },
  previewRightActions: {
    position: 'absolute',
    right: 12,
    bottom: height * 0.15,
    alignItems: 'center',
    gap: 16,
    zIndex: 10,
  },
  previewActionBtn: {
    alignItems: 'center',
  },
  previewActionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewActionCount: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  previewBottomMetadata: {
    position: 'absolute',
    left: 16,
    bottom: Platform.OS === 'ios' ? 40 : 24,
    right: 80,
    zIndex: 10,
  },
  previewUserTag: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  previewVideoDesc: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  previewSongContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewSongText: {
    color: colors.white,
    fontSize: 13,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default MessagesScreen;
