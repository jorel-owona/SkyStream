import React from 'react';
import { View, Text, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const { width, height } = Dimensions.get('window');

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.videoPlaceholder}>
        <Text style={styles.placeholderText}>Lecteur Vidéo StreamSky</Text>
      </View>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
          <Text style={[typography.h2, styles.headerText]}>Pour Vous</Text>
        </View>
        
        <View style={styles.sideActions}>
          <View style={styles.actionButton}>
            <View style={styles.avatarPlaceholder}>
              <Icon name="user" size={24} color={colors.white} />
            </View>
          </View>
          <View style={styles.actionButton}>
            <Icon name="heart" solid size={35} color={colors.white} style={styles.actionIcon} />
            <Text style={styles.actionText}>120k</Text>
          </View>
          <View style={styles.actionButton}>
            <Icon name="comment-dots" solid size={35} color={colors.white} style={styles.actionIcon} />
            <Text style={styles.actionText}>4k</Text>
          </View>
          <View style={styles.actionButton}>
            <Icon name="share" solid size={30} color={colors.white} style={styles.actionIcon} />
            <Text style={styles.actionText}>Share</Text>
          </View>
        </View>

        <View style={styles.bottomInfo}>
          <Text style={typography.h2}>@streamsky_user</Text>
          <Text style={typography.body}>Découvrez cette magnifique vue ! #nature #streamsky</Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  videoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 20,
  },
  headerText: {
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    borderBottomWidth: 2,
    borderBottomColor: colors.white,
    paddingBottom: 5,
  },
  sideActions: {
    position: 'absolute',
    right: 15,
    bottom: 100,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  actionText: {
    ...typography.caption,
    marginTop: 5,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  bottomInfo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    width: '80%',
  },
});

export default HomeScreen;
