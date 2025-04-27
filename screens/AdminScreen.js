// screens/AdminScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import TeachersScreen from './TeachersScreen';
import StudentsScreen from './StudentsScreen';

const Tab = createBottomTabNavigator();

// Both Screen (kept here for simplicity)
const BothScreen = ({ navigation }) => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Navigation to Login is handled by App.js via useAuthState
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Both</Text>
      <Text style={styles.screenText}>This is the screen for managing both Teachers and Students.</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

// Main Admin Screen with Bottom Tabs
export default function AdminScreen() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Teachers') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Students') {
            iconName = focused ? 'school' : 'school-outline';
          } else if (route.name === 'Both') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: styles.tabBar,
        headerShown: false, // Keep header hidden for tab navigator itself
      })}
    >
      <Tab.Screen 
        name="Teachers" 
        component={TeachersScreen} 
        options={{ headerShown: false }} // We'll manage header in TeachersScreen
      />
      <Tab.Screen 
        name="Students" 
        component={StudentsScreen} 
        options={{ headerShown: false }} // We'll manage header in StudentsScreen
      />
      <Tab.Screen 
        name="Both" 
        component={BothScreen} 
        options={{ headerShown: false }} // We'll manage header in BothScreen
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f9fc',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  screenText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingBottom: 5,
    height: 60,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  logoutButton: {
    backgroundColor: '#ff3333',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});