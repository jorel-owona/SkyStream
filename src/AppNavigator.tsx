import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import CameraScreen from './screens/CameraScreen';
import { colors } from './theme/colors';

const Tab = createBottomTabNavigator();

const PlaceholderScreen = ({ name }: { name: string }) => (
  <View style={styles.placeholder}>
    <Text style={styles.text}>{name}</Text>
  </View>
);

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.surfaceLight,
            elevation: 0,
            height: 60,
            paddingBottom: 10,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{
            tabBarIcon: ({ color }) => <Icon name="home" size={20} color={color} />
          }}
        />
        <Tab.Screen 
          name="Discover" 
          component={() => <PlaceholderScreen name="Discover" />} 
          options={{
            tabBarIcon: ({ color }) => <Icon name="search" size={20} color={color} />
          }}
        />
        <Tab.Screen 
          name="Create" 
          component={CameraScreen} 
          options={{
            tabBarIcon: () => (
              <View style={styles.createButtonOuter}>
                <View style={styles.createButtonInner}>
                  <Icon name="plus" size={16} color={colors.white} />
                </View>
              </View>
            ),
            tabBarLabel: () => null,
            tabBarStyle: { display: 'none' } // Hide tab bar when in camera
          }}
        />
        <Tab.Screen 
          name="Inbox" 
          component={() => <PlaceholderScreen name="Inbox" />} 
          options={{
            tabBarIcon: ({ color }) => <Icon name="comment-dots" size={20} color={color} />
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{
            tabBarIcon: ({ color }) => <Icon name="user" size={20} color={color} />
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: colors.text,
    fontSize: 20,
  },
  createButtonOuter: {
    width: 50,
    height: 35,
    backgroundColor: colors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderLeftColor: colors.primary,
    borderRightColor: colors.secondary,
  },
  createButtonInner: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator;
