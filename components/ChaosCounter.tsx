import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

type DrinkType = 'shot' | 'beer33' | 'beer50' | 'backstage' | 'cigarette' | 'leaf';

interface ChaosCounterProps {
  onBack: () => void;
}

interface DrinkCount {
  shot: number;
  beer33: number;
  beer50: number;
  backstage: number;
  cigarette: number;
  leaf: number;
}

interface StoredData {
  drinks: DrinkCount;
  timestamp: number;
}

const drunkComments = [
  "I'm still sober, I swear!",
  "Just warming up...",
  "This is fine 🔥",
  "Maybe I should eat something",
  "OK last one for real this time",
  "Who's counting anyway?",
  "My liver hates me",
  "Reality is getting wobbly",
  "I can see sounds...",
  "Everything is spinning help",
  "I'm a beautiful chaos butterfly",
  "The floor feels nice actually",
  "I should call my ex... nah",
  "Time doesn't exist anymore",
  "I've achieved enlightenment (via alcohol)",
  "The void is calling my name",
  "I'm one with the spiral",
  "My brain has left the chat",
  "Send help (and more drinks)",
  "I've transcended mortal limits"
];

const STORAGE_KEY = 'rabbitvoid_chaos_data';
const PROFILE_KEY = 'rabbitvoid_profile_data';
const RESET_TIME_MS = 24 * 60 * 60 * 1000;

export default function ChaosCounter({ onBack }: ChaosCounterProps) {
  const [drinks, setDrinks] = useState<DrinkCount>({ 
    shot: 0, beer33: 0, beer50: 0, backstage: 0, cigarette: 0, leaf: 0 
  });
  const [chaosLevel, setChaosLevel] = useState(0);
  const [currentComment, setCurrentComment] = useState("I'm still sober, I swear!");
  const [isBroken, setIsBroken] = useState(false);
  const [recentAchievement, setRecentAchievement] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Animations - ONLY start when drinks > 0
  const [pulseAnim] = useState(new Animated.Value(0));
  const [glitchAnim] = useState(new Animated.Value(0));
  const [colorShift] = useState(new Animated.Value(0));
  const [tiltAnim] = useState(new Animated.Value(0));
  const [flashAnim] = useState(new Animated.Value(0));
  const [breakAnim] = useState(new Animated.Value(0));

  // Load saved data
  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StoredData = JSON.parse(stored);
        const now = Date.now();
        
        if (now - data.timestamp < RESET_TIME_MS) {
          // MIGRATION: Ensure new fields exist in loaded data
          const migratedDrinks: DrinkCount = {
            shot: data.drinks.shot || 0,
            beer33: data.drinks.beer33 || 0,
            beer50: data.drinks.beer50 || 0,
            backstage: data.drinks.backstage || 0,
            cigarette: data.drinks.cigarette || 0,
            leaf: data.drinks.leaf || 0
          };
          setDrinks(migratedDrinks);
        } else {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.log('Error loading chaos data:', error);
    }
  };

  const saveData = async (drinkData: DrinkCount) => {
    try {
      const data: StoredData = {
        drinks: drinkData,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.log('Error saving chaos data:', error);
    }
  };

  // Update profile with chaos data
  const updateProfile = async (chaosAdded: number, drinksAdded: number) => {
    try {
      const stored = await AsyncStorage.getItem(PROFILE_KEY);
      if (stored) {
        const profile = JSON.parse(stored);
        const updatedProfile = {
          ...profile,
          totalChaos: profile.totalChaos + chaosAdded,
          highestChaos: Math.max(profile.highestChaos, chaosLevel + chaosAdded),
          drinksConsumed: profile.drinksConsumed + drinksAdded
        };
        await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));
        return updatedProfile;
      }
    } catch (error) {
      console.log('Error updating profile:', error);
    }
    return null;
  };

  // Check for new achievements
  const checkAchievements = async (newChaosLevel: number) => {
    try {
      const stored = await AsyncStorage.getItem(PROFILE_KEY);
      if (stored) {
        const profile = JSON.parse(stored);
        
        if (newChaosLevel >= 50 && profile.highestChaos < 50) {
          setRecentAchievement('Chaos Novice');
          setTimeout(() => setRecentAchievement(null), 3000);
        }
        if (newChaosLevel >= 100 && profile.highestChaos < 100) {
          setRecentAchievement('Void Master');
          setTimeout(() => setRecentAchievement(null), 3000);
        }
        const totalDrinks = Object.values(drinks).reduce((a, b) => a + b, 0);
        if (totalDrinks >= 10 && profile.drinksConsumed < 10) {
          setRecentAchievement('Social Drinker');
          setTimeout(() => setRecentAchievement(null), 3000);
        }
      }
    } catch (error) {
      console.log('Error checking achievements:', error);
    }
  };

  // Calculate chaos level with different weights
  const calculateChaosLevel = () => {
    return Math.min(
      (drinks.shot * 10) + 
      (drinks.beer33 * 10) + 
      (drinks.beer50 * 10) + 
      (drinks.backstage * 10) + 
      (drinks.cigarette * 1) +  // 1% per cigarette
      (drinks.leaf * 1),        // 1% per leaf
      100
    );
  };

  const getRandomComment = (level: number) => {
    if (level < 10) return "I'm still sober, I swear!";
    if (level < 20) return "Just warming up...";
    if (level < 30) return "This is fine 🔥";
    if (level < 40) return "Maybe I should eat something";
    if (level < 50) return "OK last one for real this time";
    if (level < 60) return "Who's counting anyway?";
    if (level < 70) return "My liver hates me";
    if (level < 80) return "Reality is getting wobbly";
    if (level < 90) return "I can see sounds...";
    return "Everything is spinning help";
  };

  // EFFECTS ONLY WHEN DRINKS > 0!
  useEffect(() => {
    const newChaosLevel = calculateChaosLevel();
    setChaosLevel(newChaosLevel);
    setCurrentComment(getRandomComment(newChaosLevel));
    
    // Save data whenever drinks change
    saveData(drinks);

    // BREAK THE APP AT 100% CHAOS!
    if (newChaosLevel >= 100 && !isBroken) {
      setIsBroken(true);
      triggerTotalBreakdown();
      return;
    }

    // Reset broken state if chaos drops
    if (isBroken && newChaosLevel < 100) {
      setIsBroken(false);
      breakAnim.setValue(0);
    }

    // ONLY START EFFECTS IF DRINKS > 0!
    if (newChaosLevel > 0) {
      // Pulsing background based on chaos
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000 - (newChaosLevel * 15),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 2000 - (newChaosLevel * 15),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Random glitch effects at higher chaos
      if (newChaosLevel > 30) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(glitchAnim, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(glitchAnim, {
              toValue: 0,
              duration: 5000 - (newChaosLevel * 40),
              useNativeDriver: true,
            }),
          ])
        ).start();
      }

      // Color shifting madness
      if (newChaosLevel > 50) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(colorShift, {
              toValue: 1,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(colorShift, {
              toValue: 0,
              duration: 3000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }

      // Random screen tilt at higher chaos
      if (newChaosLevel > 60) {
        const randomTilt = () => {
          Animated.sequence([
            Animated.timing(tiltAnim, {
              toValue: Math.random() * 0.1 - 0.05,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(tiltAnim, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]).start(() => randomTilt());
        };
        randomTilt();
      }

      // REDUCED INTENSITY: Random color flashes
      if (newChaosLevel > 40) {
        const randomFlash = () => {
          Animated.sequence([
            Animated.timing(flashAnim, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(flashAnim, {
              toValue: 0,
              duration: Math.random() * 3000 + 2000,
              useNativeDriver: true,
            }),
          ]).start(() => randomFlash());
        };
        randomFlash();
      }

      // Random comment changes at higher chaos
      if (newChaosLevel > 50) {
        const commentInterval = setInterval(() => {
          const randomIndex = Math.floor(Math.random() * drunkComments.length);
          setCurrentComment(drunkComments[randomIndex]);
        }, 5000 - (newChaosLevel * 40));
        
        return () => clearInterval(commentInterval);
      }
    } else {
      // STOP ALL EFFECTS WHEN DRINKS = 0
      pulseAnim.stopAnimation();
      glitchAnim.stopAnimation();
      colorShift.stopAnimation();
      tiltAnim.stopAnimation();
      flashAnim.stopAnimation();
      
      // Reset animation values
      pulseAnim.setValue(0);
      glitchAnim.setValue(0);
      colorShift.setValue(0);
      tiltAnim.setValue(0);
      flashAnim.setValue(0);
    }
  }, [drinks, isBroken]);

  const triggerTotalBreakdown = () => {
    // Stop all other animations
    pulseAnim.stopAnimation();
    glitchAnim.stopAnimation();
    colorShift.stopAnimation();
    tiltAnim.stopAnimation();
    flashAnim.stopAnimation();

    // Start breakdown sequence
    Animated.sequence([
      Animated.timing(breakAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(breakAnim, {
        toValue: 0.5,
        duration: 3000,
        useNativeDriver: true,
      }),
    ]).start();

    setCurrentComment("I'VE BROKEN THE VOID!!!");
  };

  const addDrink = async (type: DrinkType) => {
    if (isBroken) return;
    
    const newDrinks = { ...drinks, [type]: drinks[type] + 1 };
    setDrinks(newDrinks);
    
    const newChaosLevel = calculateChaosLevel();
    const chaosAdded = type === 'cigarette' || type === 'leaf' ? 1 : 10;
    const drinksAdded = 1;
    
    // Update profile and check achievements
    await updateProfile(chaosAdded, drinksAdded);
    await checkAchievements(newChaosLevel);
    
    // Visual feedback
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const resetChaos = async () => {
    // Stop ALL animations
    pulseAnim.stopAnimation();
    glitchAnim.stopAnimation();
    colorShift.stopAnimation();
    tiltAnim.stopAnimation();
    flashAnim.stopAnimation();
    breakAnim.stopAnimation();
    
    // Reset ALL animation values to zero
    pulseAnim.setValue(0);
    glitchAnim.setValue(0);
    colorShift.setValue(0);
    tiltAnim.setValue(0);
    flashAnim.setValue(0);
    breakAnim.setValue(0);
    
    // Reset state
    setDrinks({ shot: 0, beer33: 0, beer50: 0, backstage: 0, cigarette: 0, leaf: 0 });
    setChaosLevel(0);
    setCurrentComment("I'm still sober, I swear!");
    setIsBroken(false);
    setRecentAchievement(null);
    setShowResetConfirm(false);
    
    // Clear stored data
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.log('Error clearing data:', error);
    }
  };

  // Animation interpolations
  const glitchTranslateX = glitchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.random() * 20 - 10]
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02]
  });

  const tiltRotation = tiltAnim.interpolate({
    inputRange: [-0.1, 0.1],
    outputRange: ['-5deg', '5deg']
  });

  // REDUCED INTENSITY: Lower flash opacity
  const flashOpacity = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15] // Reduced from 0.3 to 0.15
  });

  const breakScale = breakAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5]
  });

  const breakRotate = breakAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1080deg']
  });

  if (isBroken) {
    return (
      <Animated.View style={[
        styles.container,
        {
          transform: [
            { scale: breakScale },
            { rotate: breakRotate }
          ]
        }
      ]}>
        <LinearGradient
          colors={['#ff0000', '#ff00ff', '#0000ff']}
          style={StyleSheet.absoluteFillObject}
        />
        
        <View style={styles.breakdownContainer}>
          <Text style={styles.breakdownTitle}>💥 VOID CRITICAL FAILURE 💥</Text>
          <Text style={styles.breakdownText}>You've achieved maximum chaos!</Text>
          <Text style={styles.breakdownText}>The RabbitVoid cannot handle this much power!</Text>
          
          <TouchableOpacity style={styles.emergencyReset} onPress={resetChaos}>
            <Text style={styles.emergencyResetText}>🚨 EMERGENCY RESET 🚨</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[
      styles.container, 
      { 
        transform: [
          { scale: pulseScale },
          { rotate: tiltRotation }
        ]
      }
    ]}>
      <LinearGradient
        colors={['#000000', '#1a0033', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Random flash overlay - REDUCED INTENSITY */}
      <Animated.View style={[
        StyleSheet.absoluteFillObject,
        { 
          backgroundColor: '#ff00ff',
          opacity: flashOpacity 
        }
      ]} />

      {/* Achievement Popup */}
      {recentAchievement && (
        <View style={styles.achievementPopup}>
          <Text style={styles.achievementPopupText}>🎉 {recentAchievement} UNLOCKED! 🎉</Text>
        </View>
      )}

      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← BACK TO VOID</Text>
        </TouchableOpacity>
      </View>
      
      {/* Chaos Level Indicator */}
      <View style={styles.chaosHeader}>
        <Text style={styles.chaosTitle}>CHAOS LEVEL</Text>
        <View style={styles.chaosMeter}>
          <View style={[styles.chaosFill, { width: `${chaosLevel}%` }]} />
          <Text style={styles.chaosText}>{chaosLevel}%</Text>
        </View>
      </View>

      {/* Drink Counters - UPDATED WITH NEW ITEMS */}
      <View style={styles.countersGrid}>
        <DrinkButton 
          type="shot" 
          count={drinks.shot} 
          onPress={() => addDrink('shot')}
          color="#ff00ff"
          emoji="🥃"
          name="SHOTS"
          chaosPerUnit="10%"
        />
        <DrinkButton 
          type="beer33" 
          count={drinks.beer33} 
          onPress={() => addDrink('beer33')}
          color="#00ffff"
          emoji="🍺"
          name="BEER 0.33L"
          chaosPerUnit="10%"
        />
        <DrinkButton 
          type="beer50" 
          count={drinks.beer50} 
          onPress={() => addDrink('beer50')}
          color="#00ff00"
          emoji="🍻"
          name="BEER 0.5L"
          chaosPerUnit="10%"
        />
        <DrinkButton 
          type="backstage" 
          count={drinks.backstage} 
          onPress={() => addDrink('backstage')}
          color="#ffff00"
          emoji="🎪"
          name="BACKSTAGE"
          chaosPerUnit="10%"
        />
        {/* NEW: Cigarettes */}
        <DrinkButton 
          type="cigarette" 
          count={drinks.cigarette} 
          onPress={() => addDrink('cigarette')}
          color="#ff6666"
          emoji="🚬"
          name="CIGARETTES"
          chaosPerUnit="1%"
        />
        {/* NEW: Leaf */}
        <DrinkButton 
          type="leaf" 
          count={drinks.leaf} 
          onPress={() => addDrink('leaf')}
          color="#66ff66"
          emoji="🍃"
          name="LEAF"
          chaosPerUnit="1%"
        />
      </View>

      {/* Drunk Commentary */}
      <View style={styles.commentContainer}>
        <Text style={styles.commentText}>"{currentComment}"</Text>
      </View>

      {/* Total Consumption */}
      <Animated.View style={[styles.totalContainer, { transform: [{ translateX: glitchTranslateX }] }]}>
        <Text style={styles.totalText}>TOTAL CONSUMED:</Text>
        <Text style={styles.totalNumber}>
          {drinks.shot + drinks.beer33 + drinks.beer50 + drinks.backstage + drinks.cigarette + drinks.leaf}
        </Text>
      </Animated.View>

      {/* Reset Button */}
      <TouchableOpacity 
        style={styles.resetButton} 
        onPress={() => setShowResetConfirm(true)}
      >
        <Text style={styles.resetText}>RESET CHAOS</Text>
      </TouchableOpacity>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>🚨 RESET CHAOS? 🚨</Text>
            <Text style={styles.confirmText}>
              This will erase all your progress{'\n'}
              and return you to sobriety.
            </Text>
            <Text style={styles.confirmSubtext}>
              Current chaos: {chaosLevel}%
            </Text>
            
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={styles.confirmCancel} 
                onPress={() => setShowResetConfirm(false)}
              >
                <Text style={styles.confirmCancelText}>KEEP CHAOS</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmReset} 
                onPress={resetChaos}
              >
                <Text style={styles.confirmResetText}>RESET EVERYTHING</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Visual Effects */}
      {chaosLevel > 70 && chaosLevel < 100 && (
        <View style={styles.madnessOverlay} pointerEvents="none">
          <Text style={styles.madnessText}>REALITY BREAKING...</Text>
        </View>
      )}
    </Animated.View>
  );
}

// Updated DrinkButton Component with chaos info
const DrinkButton = ({ type, count, onPress, color, emoji, name, chaosPerUnit }: any) => (
  <TouchableOpacity style={styles.drinkButton} onPress={onPress}>
    <Text style={[styles.drinkEmoji, { textShadowColor: color }]}>{emoji}</Text>
    <Text style={[styles.drinkName, { color }]}>{name}</Text>
    <Text style={[styles.drinkCount, { color }]}>{count}</Text>
    <Text style={styles.chaosPerUnit}>+{chaosPerUnit}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 50,
  },
  backButton: {
    padding: 10,
  },
  backText: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chaosHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  chaosTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 10,
  },
  chaosMeter: {
    width: width * 0.8,
    height: 20,
    backgroundColor: '#333333',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  chaosFill: {
    height: '100%',
    backgroundColor: '#ff00ff',
    borderRadius: 10,
  },
  chaosText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: 'bold',
    lineHeight: 20,
  },
  countersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  drinkButton: {
    width: '48%',
    alignItems: 'center',
    padding: 15,
    marginBottom: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  drinkEmoji: {
    fontSize: 40,
    marginBottom: 5,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  drinkName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  drinkCount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  chaosPerUnit: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontStyle: 'italic',
  },
  commentContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
    minHeight: 60,
    justifyContent: 'center',
  },
  commentText: {
    color: '#ffff00',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    textShadowColor: '#ff00ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  totalContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#8a2be2',
  },
  totalText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  totalNumber: {
    color: '#00ffff',
    fontSize: 32,
    fontWeight: 'bold',
    textShadowColor: '#8a2be2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  resetButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    padding: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ff0000',
    alignItems: 'center',
  },
  resetText: {
    color: '#ff0000',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  madnessOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 255, 0.1)',
  },
  madnessText: {
    color: '#ff00ff',
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: '#00ffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    transform: [{ rotate: '-5deg' }],
  },
  breakdownContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  breakdownTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: '#ff0000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  breakdownText: {
    color: '#ffff00',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: '#ff00ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  emergencyReset: {
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#ffff00',
    marginTop: 30,
  },
  emergencyResetText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  achievementPopup: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ff00ff',
    zIndex: 1000,
  },
  achievementPopupText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  confirmModal: {
    backgroundColor: 'rgba(138, 43, 226, 0.95)',
    padding: 25,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#ff00ff',
    alignItems: 'center',
    width: '80%',
  },
  confirmTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: '#ff0000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  confirmText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 20,
  },
  confirmSubtext: {
    color: '#ffff00',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmCancel: {
    backgroundColor: 'rgba(0, 255, 255, 0.3)',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#00ffff',
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  confirmCancelText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  confirmReset: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#ff0000',
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  confirmResetText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});