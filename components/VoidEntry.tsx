import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import MainApp from './MainApp';

export default function VoidEntry() {
  const [enteringVoid, setEnteringVoid] = useState(false);
  const videoRef = useRef<Video>(null);

  const handleEnterVoid = async () => {
    setEnteringVoid(true);
  };

  if (enteringVoid) {
    return <MainApp />;
  }

  return (
    <View style={styles.container}>
      {/* Spiral Video Background */}
      <Video
        ref={videoRef}
        source={require('../assets/spiral.mp4')} // Adjust path to your video
        style={styles.videoBackground}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
        rate={1.0}
      />

      {/* Dark overlay to ensure text readability */}
      <View style={styles.videoOverlay} />

      {/* Your premium button intact */}
      <TouchableOpacity style={styles.voidButton} onPress={handleEnterVoid}>
        <Text style={styles.buttonText}>ENTER THE VOID</Text>
        <View style={styles.pulseEffect} />
        <View style={styles.pulseEffect2} />
      </TouchableOpacity>
    </View>

    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  videoBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  voidButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#8a2be2',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 50,
    position: 'relative',
    shadowColor: '#8a2be2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 25,
    elevation: 10,
  },
  buttonText: {
    color: '#00ffff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 3,
    textShadowColor: '#8a2be2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  pulseEffect: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderWidth: 1,
    borderColor: '#00ffff',
    borderRadius: 60,
    opacity: 0.7,
  },
  pulseEffect2: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderWidth: 1,
    borderColor: '#ff00ff',
    borderRadius: 70,
    opacity: 0.4,
  },
  voidContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  introTitle: {
    color: '#00ffff',
    fontSize: 30,
    fontWeight: 'bold',
    letterSpacing: 3,
    textShadowColor: '#712ab4ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  voidText: {
    color: '#ff00ff',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: '#8a2be2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
});