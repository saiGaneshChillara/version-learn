import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function SettingsScreen({ runningMode, setRunningMode, isGuest }) {
  const navigation = useNavigation();

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
              Alert.alert('Success', 'You have been logged out');
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleRunningModeToggle = (value) => {
    if (setRunningMode) {
      setRunningMode(value);
    } else {
      console.error('setRunningMode is not provided');
    }
  };

  const handleAccountPress = () => {
   
    navigation.navigate('AccountScreen'); 
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Settings Options */}
      <View style={styles.settingsContainer}>
        {!isGuest && (
          <TouchableOpacity
            style={styles.optionRow}
            onPress={handleAccountPress}
            accessibilityLabel="Account settings"
            accessibilityHint="Navigate to account details"
          >
            <Text style={styles.optionText}>Account</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}

        <View style={styles.optionRow}>
          <Text style={styles.optionText}>Running Mode</Text>
          <Switch
            onValueChange={handleRunningModeToggle}
            value={runningMode}
            trackColor={{ false: '#ccc', true: '#1DB954' }}
            thumbColor={runningMode ? '#fff' : '#f4f3f4'}
            style={styles.toggleSwitch}
            accessibilityLabel="Running Mode Toggle"
            accessibilityHint="Enables auto-play when running is detected"
          />
        </View>

        {!isGuest && (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            accessibilityLabel="Logout button"
            accessibilityHint="Signs you out of the application"
          >
            <Text style={styles.logoutText} accessibilityRole="button">
              Logout
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  settingsContainer: {
    flex: 1,
    width: '90%',
    alignSelf: 'center',
    paddingVertical: 30,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  optionText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  arrow: {
    fontSize: 24,
    color: '#666',
  },
  toggleSwitch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  logoutButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 40,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});