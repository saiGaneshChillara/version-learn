import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import TeacherSubjects from './TeacherSubjects.js';
import Communities from './Communities';
import Profile from './Profile';

const Tab = createBottomTabNavigator();

export default function TeacherSubjectContent() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Subjects') {
            iconName = 'book-outline';
          } else if (route.name === 'Communities') {
            iconName = 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = 'person-outline';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { backgroundColor: '#fff', paddingBottom: 5 },
      })}
    >
      <Tab.Screen name="Subjects" component={TeacherSubjects} />
      <Tab.Screen name="Communities" component={Communities} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}
