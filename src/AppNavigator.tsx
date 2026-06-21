import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import HomeScreen from './screens/HomeScreen';
import FriendsScreen from './screens/FriendsScreen';
import ProfileScreen from './screens/ProfileScreen';
import CameraScreen from './screens/CameraScreen';
import LandingScreen from './screens/LandingScreen';
import MessagesScreen from './screens/MessagesScreen';
import { colors } from './theme/colors';
import { typography } from './theme/typography';
import { useAuth } from './context/AuthContext';

const Tab = createBottomTabNavigator();

const DummyScreen = () => null;

const AppNavigator = () => {
  const { user, loading, isCameraOpen, setIsCameraOpen, cameraMode } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Custom component for the middle TikTok plus button
  const TikTokPlusButton = () => (
    <View style={styles.createButtonContainer}>
      <View style={[styles.createButtonSide, { backgroundColor: colors.primary, left: -3 }]} />
      <View style={[styles.createButtonSide, { backgroundColor: colors.secondary, right: -3 }]} />
      <View style={styles.createButtonCenter}>
        <Icon name="add" size={20} color={colors.black} />
      </View>
    </View>
  );

  return (
    <NavigationContainer>
      <View style={{ flex: 1 }}>
        {user ? (
          <>
            <Tab.Navigator
              initialRouteName={user.isGuest ? 'Accueil' : 'Profil'} // Home tab for guest, Profile for signed-in user
              screenOptions={{
                headerShown: false,
                tabBarStyle: {
                  backgroundColor: colors.black, // TikTok bottom bar is pure black
                  borderTopWidth: 0.5,
                  borderTopColor: 'rgba(255, 255, 255, 0.1)',
                  height: 60,
                  paddingBottom: 8,
                  paddingTop: 4,
                },
                tabBarActiveTintColor: colors.white, // Active label is white
                tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)', // Inactive is grey
                tabBarLabelStyle: {
                  fontSize: 10,
                  fontWeight: '600',
                  marginTop: 2,
                },
              }}
            >
              <Tab.Screen
                name="Accueil"
                component={HomeScreen}
                options={{
                  tabBarLabel: 'Accueil',
                  tabBarIcon: ({ color, focused }) => (
                    <Icon name={focused ? 'home' : 'home-outline'} size={24} color={color} />
                  ),
                }}
              />
              <Tab.Screen
                name="Ami(e)s"
                component={FriendsScreen}
                options={{
                  tabBarLabel: 'Ami(e)s',
                  tabBarIcon: ({ color, focused }) => (
                    <Icon name={focused ? 'people' : 'people-outline'} size={24} color={color} />
                  ),
                }}
              />
              <Tab.Screen
                name="Create"
                component={DummyScreen}
                options={{
                  tabBarLabel: () => null,
                  tabBarIcon: () => <TikTokPlusButton />,
                }}
                listeners={{
                  tabPress: (e) => {
                    e.preventDefault();
                    setIsCameraOpen(true); // Open Camera Modal overlay via global state
                  },
                }}
              />
              <Tab.Screen
                name="Messages"
                component={MessagesScreen}
                options={{
                  tabBarLabel: 'Messages',
                  tabBarIcon: ({ color, focused }) => (
                    <Icon name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} size={24} color={color} />
                  ),
                  tabBarBadge: 1, // Nice badge indicator like in mockup
                  tabBarBadgeStyle: {
                    backgroundColor: colors.secondary,
                    color: colors.white,
                    fontSize: 10,
                    lineHeight: 14,
                  },
                }}
              />
              <Tab.Screen
                name="Profil"
                component={ProfileScreen}
                options={{
                  tabBarLabel: 'Profil',
                  tabBarIcon: ({ color, focused }) => (
                    <Icon name={focused ? 'person' : 'person-outline'} size={24} color={color} />
                  ),
                }}
              />
            </Tab.Navigator>

            {/* Camera Overlay Modal */}
            <Modal
              visible={isCameraOpen}
              animationType="slide"
              onRequestClose={() => setIsCameraOpen(false)}
            >
              <CameraScreen onClose={() => setIsCameraOpen(false)} initialMode={cameraMode} />
            </Modal>

            {/* Username Selection Modal */}
            <UsernamePromptModal />
          </>
        ) : (
          <LandingScreen />
        )}
      </View>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonContainer: {
    width: 46,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: 4,
  },
  createButtonSide: {
    position: 'absolute',
    width: 38,
    height: 28,
    borderRadius: 8,
    top: 1,
  },
  createButtonCenter: {
    width: 38,
    height: 28,
    backgroundColor: colors.white,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  inboxContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inboxHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  inboxTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  inboxHeaderIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerIconBtn: {
    padding: 4,
  },
  emptyInbox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  chatIconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  inboxButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  inboxButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  usernameOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  usernameModalContent: {
    width: '100%',
    backgroundColor: '#1E152E',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  usernameModalTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  usernameModalSub: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  usernameInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 24,
  },
  atSymbol: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    marginRight: 4,
  },
  usernameInput: {
    flex: 1,
    color: colors.white,
    fontSize: 16,
    padding: 0,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    height: 50,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: colors.black,
    fontWeight: '700',
    fontSize: 15,
  },
});

// Username Prompt component to block app access until displayName is chosen
const UsernamePromptModal = () => {
  const { user, updateProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const visible = !!user && (!user.displayName || user.displayName.trim() === '' || user.displayName === 'Invité');

  useEffect(() => {
    if (user && user.displayName && user.displayName !== 'Invité') {
      const cleanName = user.displayName.toLowerCase().replace(/[^a-z0-9_]/g, '');
      setUsername(cleanName);
    }
  }, [user]);

  const handleConfirm = async () => {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      Alert.alert('Erreur', "Le nom d'utilisateur doit contenir au moins 3 caractères (lettres, chiffres et tirets bas).");
      return;
    }
    try {
      setIsSaving(true);
      await updateProfile(cleanUsername, '', '');
    } catch (err) {
      Alert.alert('Erreur', "Impossible de configurer le nom d'utilisateur.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.usernameOverlay}>
        <View style={styles.usernameModalContent}>
          <Text style={styles.usernameModalTitle}>Votre Pseudonyme 👤</Text>
          <Text style={styles.usernameModalSub}>
            Entrez un nom d'utilisateur unique pour votre compte (sans espaces).
          </Text>
          
          <View style={styles.usernameInputWrapper}>
            <Text style={styles.atSymbol}>@</Text>
            <TextInput
              style={styles.usernameInput}
              value={username}
              onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="pseudonyme"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              autoFocus
              maxLength={20}
              editable={!isSaving}
            />
          </View>

          <TouchableOpacity 
            style={[styles.confirmBtn, !username.trim() && { opacity: 0.5 }]} 
            onPress={handleConfirm}
            disabled={isSaving || !username.trim()}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.black} />
            ) : (
              <Text style={styles.confirmBtnText}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AppNavigator;
