import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ChaosCounter from './ChaosCounter';
import VoidProfile from './VoidProfile';
import DiceDuel from './DiceDuel';
import ChillZone from './ChillZone';

type AppScreen = 'mainMenu' | 'voidProfile' | 'chaosCounter' | 'chillZone' | 'diceDuel' | 'staringContest' | 'truthOrDare' | 'realityTelephone' | 'voidCharades' | 'cardOfChaos';

export default function MainApp() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('mainMenu');

  // Navigation conditions
  if (currentScreen === 'voidProfile') {
    return <VoidProfile onBack={() => setCurrentScreen('mainMenu')} />;
  }
  
  if (currentScreen === 'chaosCounter') {
    return <ChaosCounter onBack={() => setCurrentScreen('mainMenu')} />;
  }
  
  if (currentScreen === 'chillZone') {
    return (
      <ChillZone 
        onBack={() => setCurrentScreen('mainMenu')}
        onNavigateToGame={(gameScreen) => setCurrentScreen(gameScreen as AppScreen)}
      />
    );
  }
  
  if (currentScreen === 'diceDuel') {
    return <DiceDuel onBack={() => setCurrentScreen('chillZone')} />;
  }

  // Future game screens will go here
  if (currentScreen === 'staringContest') {
    return (
      <View style={styles.container}>
        <Text style={styles.comingSoonText}>👁️ VOID STARING CONTEST</Text>
        <Text style={styles.comingSoonSubtext}>Coming Soon!</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setCurrentScreen('chillZone')}
        >
          <Text style={styles.backButtonText}>← BACK TO CHILLZONE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Add similar blocks for other future games...

  return (
    <LinearGradient
      colors={['#000000', '#1a0033', '#000000']}
      style={styles.container}
    >
      <Text style={styles.welcomeText}>WELCOME TO THE VOID</Text>
      
      {/* Reorganized Menu - Profile First! */}
      <View style={styles.menuContainer}>
        <MenuButton 
          title="👤 VOID PROFILE" 
          onPress={() => setCurrentScreen('voidProfile')}
          color="#00ffff"
        />
        <MenuButton 
          title="🧪 CHAOS COUNTER" 
          onPress={() => setCurrentScreen('chaosCounter')}
          color="#ff00ff"
        />
        <MenuButton 
          title="🎮 CHILLZONE" 
          onPress={() => setCurrentScreen('chillZone')}
          color="#ffff00"
        />
      </View>

      <Text style={styles.hintText}>Reality is optional in the void...</Text>
    </LinearGradient>
  );
}

const MenuButton = ({ title, onPress, color, disabled = false }: any) => (
  <TouchableOpacity 
    style={[styles.menuButton, { opacity: disabled ? 0.3 : 1 }]} 
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={[styles.menuText, { color }]}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeText: {
    color: '#00ffff',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: '#ff00ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 50,
  },
  menuContainer: {
    width: '100%',
    alignItems: 'center',
  },
  menuButton: {
    width: '80%',
    padding: 20,
    marginBottom: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  hintText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 30,
    fontStyle: 'italic',
  },
  comingSoonText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  comingSoonSubtext: {
    color: '#ffff00',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: 'rgba(0, 255, 255, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00ffff',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});