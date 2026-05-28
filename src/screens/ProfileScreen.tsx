import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import Icon from 'react-native-vector-icons/FontAwesome5';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="user-plus" size={20} color={colors.text} />
        <Text style={typography.h2}>Profile</Text>
        <Icon name="bars" size={20} color={colors.text} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Icon name="user" size={40} color={colors.background} />
            </View>
            <TouchableOpacity style={styles.addAvatarButton}>
              <Icon name="plus" size={12} color={colors.white} />
            </TouchableOpacity>
          </View>
          
          <Text style={[typography.h3, styles.username]}>@streamsky_user</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={typography.h2}>77</Text>
              <Text style={typography.caption}>Suivis</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={typography.h2}>377</Text>
              <Text style={typography.caption}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={typography.h2}>457</Text>
              <Text style={typography.caption}>J'aime</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.editButton}>
              <Text style={typography.bodyBold}>Modifier le profil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="instagram" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <Text style={[typography.body, styles.bio]}>Bienvenue sur mon profil StreamSky ! ✨</Text>
        </View>

        <View style={styles.tabsContainer}>
          <View style={[styles.tab, styles.activeTab]}>
            <Icon name="border-all" size={24} color={colors.text} />
          </View>
          <View style={styles.tab}>
            <Icon name="heart" size={24} color={colors.textSecondary} />
          </View>
        </View>

        <View style={styles.gridContainer}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <View key={item} style={styles.gridItem}>
              <Icon name="play" size={24} color={colors.textSecondary} style={styles.playIcon} />
            </View>
          ))}
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceLight,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileInfo: {
    alignItems: 'center',
    paddingTop: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.secondary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  username: {
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    width: 80,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.surfaceLight,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 5,
  },
  iconButton: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  bio: {
    textAlign: 'center',
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceLight,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: width / 3 - 2,
    height: (width / 3) * 1.3,
    backgroundColor: colors.surface,
    margin: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    opacity: 0.5,
  },
});

export default ProfileScreen;
