import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import VoidEntry from './components/VoidEntry';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" hidden={true} />
      <VoidEntry />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});