import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const LandingScreen = () => {
  const { loginAsGuest, loginWithGoogle, loginWithApple } = useAuth();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingGuest, setLoadingGuest] = useState(false);

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    await loginWithGoogle();
    setLoadingGoogle(false);
  };

  const handleAppleLogin = async () => {
    setLoadingGoogle(true);
    await loginWithApple();
    setLoadingGoogle(false);
  };

  const handleGuestLogin = () => {
    setLoadingGuest(true);
    setTimeout(() => {
      loginAsGuest();
      setLoadingGuest(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[colors.background, '#1F103A', '#0F051C']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Orbs */}
      <View style={styles.cyanOrb} />
      <View style={styles.magentaOrb} />

      <View style={styles.content}>
        {/* Logo and Brand */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../asset/logo StreamSky.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>StreamSky</Text>
          <Text style={styles.tagline}>Le futur du partage vidéo en direct</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Text style={styles.title}>Rejoignez la communauté</Text>
          <Text style={styles.subtitle}>
            Créez un compte pour interagir, liker, commenter et partager des vidéos uniques.
          </Text>

          {/* Google Login Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={loadingGoogle || loadingGuest}
          >
            {loadingGoogle ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <View style={styles.buttonInner}>
                <Icon name="logo-google" size={22} color={colors.background} style={styles.buttonIcon} />
                <Text style={styles.googleButtonText}>Continuer avec Google</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Apple Login Button */}
          <TouchableOpacity
            style={styles.appleButton}
            onPress={handleAppleLogin}
            disabled={loadingGoogle || loadingGuest}
          >
            <View style={styles.buttonInner}>
              <Icon name="logo-apple" size={22} color={colors.white} style={styles.buttonIcon} />
              <Text style={styles.appleButtonText}>Continuer avec Apple</Text>
            </View>
          </TouchableOpacity>

          {/* Guest Button */}
          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleGuestLogin}
            disabled={loadingGoogle || loadingGuest}
          >
            {loadingGuest ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.guestButtonText}>Continuer en tant qu'invité</Text>
            )}
          </TouchableOpacity>

          {/* Terms Footer */}
          <Text style={styles.footerText}>
            En continuant, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cyanOrb: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.primary,
    opacity: 0.15,
    shadowColor: colors.primary,
    shadowRadius: 100,
    shadowOpacity: 1,
  },
  magentaOrb: {
    position: 'absolute',
    bottom: 150,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.secondary,
    opacity: 0.12,
    shadowColor: colors.secondary,
    shadowRadius: 120,
    shadowOpacity: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: height * 0.1,
    paddingBottom: height * 0.03,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoImage: {
    width: 130,
    height: 130,
    marginBottom: 10,
  },
  brandName: {
    ...typography.h1,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 1,
    color: colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 6,
  },
  tagline: {
    ...typography.caption,
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  actionsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 18,
  },
  googleButton: {
    width: '100%',
    height: 50,
    backgroundColor: colors.white,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: colors.white,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  appleButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#000000',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  guestButton: {
    width: '100%',
    height: 50,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '700',
  },
  appleButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  guestButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  footerText: {
    ...typography.caption,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
});

export default LandingScreen;
