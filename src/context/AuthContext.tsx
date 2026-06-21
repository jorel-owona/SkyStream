import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import auth from '@react-native-firebase/auth';

// Defensive import for Google Sign-In to handle environment/network limitations
let GoogleSignin: any = null;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch (e) {
  console.warn('Google Sign-In module is not installed or available:', e);
}

// Defensive import for Apple Sign-In
let appleAuth: any = null;
try {
  appleAuth = require('@react-native-apple-authentication/apple-authentication').appleAuth;
} catch (e) {
  console.warn('Apple Authentication module is not installed or available:', e);
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isGuest: boolean;
  bio?: string;
  website?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginAsGuest: () => void | Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (displayName: string, bio: string, photoURL: string, website?: string) => Promise<void>;
  bookmarkedIds: string[];
  likedIds: string[];
  toggleBookmark: (videoId: string) => void;
  toggleLike: (videoId: string) => void;
  isCameraOpen: boolean;
  setIsCameraOpen: (open: boolean) => void;
  cameraMode: 'video' | 'story';
  setCameraMode: (mode: 'video' | 'story') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Web Client ID from Firebase Console (retrieve from Firebase -> Authentication -> Google Sign-In)
// Set to a placeholder. If configured, real Google Sign-In is triggered.
const GOOGLE_WEB_CLIENT_ID = '496539035044-tueaccv3ukhul1nifh9pkddl3989k0o7.apps.googleusercontent.com';

if (GoogleSignin) {
  try {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
      offlineAccess: true,
    });
  } catch (e) {
    console.warn('GoogleSignin.configure error:', e);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'video' | 'story'>('video');

  // Monitor real Firebase auth state changes
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUser((prev) => ({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || null,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL || null,
          isGuest: false,
          bio: prev?.bio || '',
        }));
      } else {
        setUser((prev) => (prev && !prev.isGuest ? null : prev));
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginAsGuest = async () => {
    try {
      setLoading(true);
      const userCredential = await auth().signInAnonymously();
      if (userCredential.user) {
        setUser({
          uid: userCredential.user.uid,
          displayName: null, // Force to choose a username (no default 'Invité')
          email: null,
          photoURL: null,
          isGuest: true,
          bio: '',
        });
      }
      setLoading(false);
    } catch (error: any) {
      console.error('Anonymous sign-in failed:', error);
      setLoading(false);
      Alert.alert('Erreur', "Impossible de se connecter en mode invité. Veuillez réessayer.");
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      console.log('Attempting Google Sign-In...');

      if (!GoogleSignin || !GOOGLE_WEB_CLIENT_ID) {
        setLoading(false);
        Alert.alert(
          'Configuration manquante',
          'La configuration Google Sign-In est incomplète. Vérifiez le Web Client ID Firebase.'
        );
        return;
      }

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();

      let idToken = (signInResult as any).idToken;
      if (!idToken && (signInResult as any).data) {
        idToken = (signInResult as any).data.idToken;
      }

      if (!idToken) {
        throw new Error('ID Token manquant dans le résultat de Google Sign-In.');
      }

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);

      if (userCredential.user) {
        setUser({
          uid: userCredential.user.uid,
          displayName: userCredential.user.displayName || null,
          email: userCredential.user.email,
          photoURL: userCredential.user.photoURL || null,
          isGuest: false,
          bio: '',
        });
      }
      setLoading(false);
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      setLoading(false);
      Alert.alert(
        'Connexion Google impossible',
        `La connexion Google a échoué (${error.message || 'Erreur de configuration'}). Voulez-vous créer un compte de test pour explorer l'application ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Créer un Compte de Test',
            onPress: () => {
              setUser({
                uid: 'test_' + Math.random().toString(36).substring(2, 9),
                displayName: null, // triggers username picker
                email: 'test@streamsky.app',
                photoURL: null,
                isGuest: false,
                bio: 'Compte de test StreamSky 🚀',
              });
            }
          }
        ]
      );
    }
  };

  const loginWithApple = async () => {
    try {
      setLoading(true);
      console.log('Attempting Apple Sign-In...');

      if (!appleAuth) {
        setLoading(false);
        Alert.alert(
          'Module non disponible',
          'L\'authentification Apple n\'est pas supportée sur ce système ou ce périphérique.'
        );
        return;
      }

      // perform native Apple request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });

      const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user);

      if (credentialState === appleAuth.State.AUTHORIZED) {
        const { identityToken, nonce } = appleAuthRequestResponse;
        if (!identityToken) {
          throw new Error('Jeton d\'identité Apple (identityToken) manquant.');
        }

        const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);
        const userCredential = await auth().signInWithCredential(appleCredential);

        if (userCredential.user) {
          setUser({
            uid: userCredential.user.uid,
            displayName: userCredential.user.displayName || null,
            email: userCredential.user.email,
            photoURL: userCredential.user.photoURL || null,
            isGuest: false,
            bio: '',
          });
        }
      } else {
        throw new Error('L\'authentification Apple a échoué (Non autorisé).');
      }
      setLoading(false);
    } catch (error: any) {
      console.error('Apple Sign-In Error:', error);
      setLoading(false);
      Alert.alert(
        'Erreur de connexion Apple',
        error.message || 'Une erreur est survenue lors de l\'authentification Apple.'
      );
    }
  };

  const logout = async () => {
    try {
      if (GoogleSignin) {
        await GoogleSignin.signOut();
      }
    } catch (e) {
      console.log('Google SignOut error:', e);
    }

    try {
      await auth().signOut();
    } catch (e) {
      console.log('Firebase signOut error:', e);
    }
    setUser(null);
  };

  const updateProfile = async (displayName: string, bio: string, photoURL: string, website?: string) => {
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        displayName,
        bio,
        photoURL,
        website: website !== undefined ? website : prev.website,
      };
    });

    try {
      const firebaseUser = auth().currentUser;
      if (firebaseUser) {
        await firebaseUser.updateProfile({
          displayName,
          photoURL,
        });
      }
    } catch (e) {
      console.log('Error updating Firebase user profile:', e);
    }
  };

  const toggleBookmark = (videoId: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(videoId) ? prev.filter((id) => id !== videoId) : [...prev, videoId]
    );
  };

  const toggleLike = (videoId: string) => {
    setLikedIds((prev) =>
      prev.includes(videoId) ? prev.filter((id) => id !== videoId) : [...prev, videoId]
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginAsGuest,
        loginWithGoogle,
        loginWithApple,
        logout,
        updateProfile,
        bookmarkedIds,
        likedIds,
        toggleBookmark,
        toggleLike,
        isCameraOpen,
        setIsCameraOpen,
        cameraMode,
        setCameraMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
