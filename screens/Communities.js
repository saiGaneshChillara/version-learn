import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Communities() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Communities Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});