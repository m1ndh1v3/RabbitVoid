import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ChaosCounter from './ChaosCounter';
import VoidProfile from './VoidProfile';
import ChillZone from './ChillZone';
import DiceDuel from './DiceDuel';
import StaringContest from './StaringContest';

const { width, height } = Dimensions.get('window');

type AppScreen = 'mainMenu' | 'voidProfile' | 'chaosCounter' | 'chillZone' | 'diceDuel' | 'staringContest' | 'truthOrDare' | 'realityTelephone' | 'voidCharades' | 'cardOfChaos';

export default function MainApp() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('mainMenu');

  // Enhanced animations
  const [pulseAnim] = useState(new Animated.Value(0));
  const [floatAnim] = useState(new Animated.Value(0));
  const [glitchAnim] = useState(new Animated.Value(0));
  const [titleScale] = useState(new Animated.Value(1));
  const [particleAnim] = useState(new Animated.Value(0));
  const [menuTilt] = useState(new Animated.Value(0));
  const [bgShift] = useState(new Animated.Value(0));

  // Enhanced floating particles
  const [particles] = useState(
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      scale: new Animated.Value(Math.random() * 0.4 + 0.2),
      rotate: new Animated.Value(0),
      translateX: new Animated.Value(Math.random() * width),
      translateY: new Animated.Value(Math.random() * height * 0.8),
      moveX: new Animated.Value(0),
      moveY: new Animated.Value(0),
      speed: Math.random() * 2 + 1,
      direction: Math.random() > 0.5 ? 1 : -1,
    }))
  );

  useEffect(() => {
    // Enhanced pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Random glitch effects
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.6) {
        Animated.sequence([
          Animated.timing(glitchAnim, {
            toValue: 1,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(glitchAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, 3000);

    // Title scale animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(titleScale, {
          toValue: 1.08,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(titleScale, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Background color shift
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgShift, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bgShift, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animate particles
    particles.forEach(particle => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(particle.rotate, {
            toValue: 1,
            duration: 5000 * particle.speed,
            useNativeDriver: true,
          }),
          Animated.timing(particle.rotate, {
            toValue: 0,
            duration: 5000 * particle.speed,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Floating movement
      Animated.loop(
        Animated.sequence([
          Animated.timing(particle.moveX, {
            toValue: particle.direction * 30,
            duration: 4000 * particle.speed,
            useNativeDriver: true,
          }),
          Animated.timing(particle.moveX, {
            toValue: 0,
            duration: 4000 * particle.speed,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(particle.moveY, {
            toValue: 20,
            duration: 3000 * particle.speed,
            useNativeDriver: true,
          }),
          Animated.timing(particle.moveY, {
            toValue: 0,
            duration: 3000 * particle.speed,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Subtle menu tilt
    Animated.loop(
      Animated.sequence([
        Animated.timing(menuTilt, {
          toValue: 0.03,
          duration: 7000,
          useNativeDriver: true,
        }),
        Animated.timing(menuTilt, {
          toValue: -0.03,
          duration: 7000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => clearInterval(glitchInterval);
  }, []);

  // Enhanced animation interpolations
  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.6]
  });

  const floatTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15]
  });

  const glitchTranslateX = glitchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.random() * 25 - 12.5]
  });

  const menuRotation = menuTilt.interpolate({
    inputRange: [-0.03, 0.03],
    outputRange: ['-3deg', '3deg']
  });

  const bgColors = bgShift.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ff00ff', '#0000ff']
  });
// Navigation conditions - FIXED to properly handle all screens
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

// ADD THIS - Handle staringContest as a real game (not placeholder)
if (currentScreen === 'staringContest') {
  return <StaringContest onBack={() => setCurrentScreen('chillZone')} />;
}

// UPDATED - Remove staringContest from this array since it's now a real game
if (['truthOrDare', 'realityTelephone', 'voidCharades', 'cardOfChaos'].includes(currentScreen)) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1a0033', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderTitle}>
          {currentScreen === 'truthOrDare' && '🎯 TRUTH OR VOID DARE'}
          {currentScreen === 'realityTelephone' && '📞 REALITY TELEPHONE'}
          {currentScreen === 'voidCharades' && '🎭 VOID CHARADES'}
          {currentScreen === 'cardOfChaos' && '🃏 CARD OF CHAOS'}
        </Text>
        <Text style={styles.placeholderSubtext}>🌀 Coming Soon to The Void! 🌀</Text>
        <Text style={styles.placeholderDescription}>
          This reality-distorting experience is being forged in the cosmic void...
        </Text>
        <TouchableOpacity 
          style={styles.placeholderButton} 
          onPress={() => setCurrentScreen('chillZone')}
        >
          <Text style={styles.placeholderButtonText}>← BACK TO CHILLZONE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

  return (
    <View style={styles.container}>
      {/* Enhanced Animated Background */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: pulseOpacity }]}>
        <LinearGradient
          colors={['#ff00ff', '#0000ff', '#00ffff']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      
      <LinearGradient
        colors={['#000000', '#1a0033', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Enhanced Floating Particles */}
      {particles.map(particle => {
        const particleScale = particle.scale.interpolate({
          inputRange: [0.2, 1],
          outputRange: [0.2, 1]
        });
        const particleRotate = particle.rotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg']
        });

        return (
          <Animated.Text
            key={particle.id}
            style={[
              styles.particle,
              {
                transform: [
                  { translateX: particle.translateX },
                  { translateY: particle.translateY },
                  { translateX: particle.moveX },
                  { translateY: particle.moveY },
                  { scale: particleScale },
                  { rotate: particleRotate }
                ],
                opacity: particle.scale.interpolate({
                  inputRange: [0.2, 0.6],
                  outputRange: [0.3, 0.8]
                })
              }
            ]}
          >
            {['🌀', '⚡', '💫', '✨', '🌌', '💥', '🌟', '🌠', '🎭', '🔥', '❄️', '💎', '🎪', '🎰', '🎲'][particle.id % 15]}
          </Animated.Text>
        );
      })}

      {/* Enhanced Glitch Overlay */}
      <Animated.View style={[
        StyleSheet.absoluteFillObject,
        { 
          backgroundColor: '#00ffff',
          opacity: glitchAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.4]
          }),
          transform: [{ translateX: glitchTranslateX }]
        }
      ]} />

      {/* Main Content */}
      <Animated.View style={[
        styles.content,
        {
          transform: [
            { translateY: floatTranslateY },
            { rotate: menuRotation }
          ]
        }
      ]}>
        {/* Enhanced Animated Title */}
        <Animated.View style={{ transform: [{ scale: titleScale }] }}>
          <Text style={styles.welcomeText}>WELCOME TO THE VOID</Text>
          <Text style={styles.subtitle}>where reality is optional</Text>
        </Animated.View>

        {/* Interactive Menu */}
        <Animated.View style={styles.menuContainer}>
          <MenuButton 
            title="👤 VOID PROFILE" 
            description="Your cosmic identity & stats"
            onPress={() => setCurrentScreen('voidProfile')}
            color="#00ffff"
            pulseAnim={pulseAnim}
          />
          <MenuButton 
            title="🧪 CHAOS COUNTER" 
            description="Track your descent into madness"
            onPress={() => setCurrentScreen('chaosCounter')}
            color="#ff00ff"
            pulseAnim={pulseAnim}
          />
          <MenuButton 
            title="🎮 CHILLZONE" 
            description="Reality-distorting games"
            onPress={() => setCurrentScreen('chillZone')}
            color="#ffff00"
            pulseAnim={pulseAnim}
          />
        </Animated.View>

        {/* Enhanced Interactive Hint */}
        <TouchableOpacity 
          style={styles.hintContainer}
          onPress={() => {
            // Enhanced easter egg - random glitch on tap
            Animated.sequence([
              Animated.timing(glitchAnim, {
                toValue: 1,
                duration: 50,
                useNativeDriver: true,
              }),
              Animated.timing(glitchAnim, {
                toValue: 0.5,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(glitchAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
              }),
            ]).start();
          }}
        >
          <Text style={styles.hintText}>
            🌀 tap anywhere for reality glitch 🌀
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// Enhanced MenuButton with better animations
const MenuButton = ({ title, description, onPress, color, pulseAnim }: any) => {
  const buttonScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03]
  });

  const borderOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9]
  });

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.3]
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Animated.View style={[
        styles.menuButton,
        { 
          transform: [{ scale: buttonScale }],
          borderColor: color
        }
      ]}>
        {/* Enhanced glow effect */}
        <Animated.View 
          style={[
            styles.menuButtonGlow,
            { 
              backgroundColor: color,
              opacity: glowOpacity
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.menuButtonBorder,
            { 
              backgroundColor: color,
              opacity: borderOpacity
            }
          ]} 
        />
        <Text style={[styles.menuTitle, { color }]}>{title}</Text>
        <Text style={styles.menuDescription}>{description}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  particle: {
    position: 'absolute',
    fontSize: 28,
    opacity: 0.7,
  },
  welcomeText: {
    color: '#00ffff',
    fontSize: 36,
    fontWeight: 'bold',
    textShadowColor: '#ff00ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 60,
    fontStyle: 'italic',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 1,
  },
  menuContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 50,
  },
  menuButton: {
    width: '90%',
    padding: 28,
    marginBottom: 25,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  menuButtonGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 35,
  },
  menuButtonBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    letterSpacing: 1,
  },
  menuDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  hintContainer: {
    padding: 18,
    backgroundColor: 'rgba(138, 43, 226, 0.25)',
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(138, 43, 226, 0.6)',
    shadowColor: '#8a2be2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  hintText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  placeholderTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: '#ff00ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  placeholderSubtext: {
    color: '#ffff00',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  placeholderDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  placeholderButton: {
    backgroundColor: 'rgba(0, 255, 255, 0.3)',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#00ffff',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  placeholderButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});