// screens/StudentsScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StudentsScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Students</Text>
      <Text style={styles.screenText}>This is the Students management screen.</Text>
    </View>
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
  },
});