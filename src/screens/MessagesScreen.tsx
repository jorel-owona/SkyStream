import React, { useState } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';

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
}

const INITIAL_CHATS: Chat[] = [
  {
    id: '1',
    name: 'Daïsy✝️💜',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    lastMessage: 'Tu as vu la nouvelle vidéo sur la page d\'accueil ? 😍',
    time: '14:32',
    unreadCount: 1,
    online: true,
    messages: [
      { id: 'm1', senderId: 'them', text: 'Coucou ! Comment ça va ?', time: '14:28' },
      { id: 'm2', senderId: 'me', text: 'Hello Daïsy ! Très bien et toi ?', time: '14:29' },
      { id: 'm3', senderId: 'them', text: 'Tu as vu la nouvelle vidéo sur la page d\'accueil ? 😍', time: '14:32' },
    ],
  },
  {
    id: '2',
    name: 'Lpb C💋',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    lastMessage: 'On s\'organise un live ce soir ? 🎥',
    time: 'Hier',
    unreadCount: 0,
    online: true,
    messages: [
      { id: 'm4', senderId: 'me', text: 'Hey ! Dispo pour tourner ?', time: 'Hier' },
      { id: 'm5', senderId: 'them', text: 'On s\'organise un live ce soir ? 🎥', time: 'Hier' },
    ],
  },
  {
    id: '3',
    name: 'Lemougou',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    lastMessage: 'Super projet mec ! 🚀🔥',
    time: '3 juin',
    unreadCount: 0,
    online: false,
    messages: [
      { id: 'm6', senderId: 'them', text: 'J\'adore ce que tu fais sur StreamSky !', time: '3 juin' },
      { id: 'm7', senderId: 'me', text: 'Merci beaucoup !', time: '3 juin' },
      { id: 'm8', senderId: 'them', text: 'Super projet mec ! 🚀🔥', time: '3 juin' },
    ],
  },
];

const MessagesScreen = () => {
  const { user, logout, setIsCameraOpen, setCameraMode } = useAuth();
  const isGuest = user?.isGuest ?? true;

  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [inputText, setInputText] = useState('');

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
  const handleSendMessage = () => {
    if (!inputText.trim() || !selectedChat) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: 'me',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update messages in modal and chat list
    const updatedMessages = [...selectedChat.messages, newMessage];
    setSelectedChat((prev) => prev ? { ...prev, messages: updatedMessages } : null);

    setChats((prev) =>
      prev.map((c) =>
        c.id === selectedChat.id
          ? {
              ...c,
              lastMessage: newMessage.text,
              time: newMessage.time,
              messages: updatedMessages,
            }
          : c
      )
    );

    setInputText('');
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
        renderItem={({ item }) => (
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
        )}
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
});

export default MessagesScreen;
