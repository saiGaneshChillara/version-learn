import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator({ runningMode, setRunningMode, isGuest, navigationRef }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Library') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: 'gray',
        headerShown: false, 
      })}
    >
      <Tab.Screen
        name="Home"
        children={(props) => <HomeScreen {...props} runningMode={runningMode} />}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
      />
      <Tab.Screen
        name="Settings"
        children={(props) => (
          <SettingsScreen
            {...props}
            runningMode={runningMode}
            setRunningMode={setRunningMode}
            isGuest={isGuest}
            navigationRef={navigationRef} 
          />
        )}
      />
    </Tab.Navigator>
  );
};