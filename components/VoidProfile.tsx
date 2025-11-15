import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

interface VoidProfileProps {
  onBack: () => void;
}

interface ProfileData {
  username: string;
  avatar: string;
  joinDate: number;
  totalChaos: number;
  highestChaos: number;
  drinksConsumed: number;
  lastRegenerate: number;
}

const prefixes = [
  'Quantum', 'Neon', 'Glitch', 'Cosmic', 'Digital', 'Virtual', 'Psychedelic', 
  'Chaos', 'Void', 'Shadow', 'Phantom', 'Echo', 'Nova', 'Solar', 'Lunar',
  'Electric', 'Cyber', 'Hyper', 'Mega', 'Ultra', 'Bio', 'Techno', 'Meta',
  'Dark', 'Light', 'Crystal', 'Atomic', 'Nuclear', 'Plasma', 'Gamma',
  'Infinite', 'Eternal', 'Celestial', 'Astral', 'Mystic', 'Arcane',
  'Fractal', 'Holographic', 'Synth', 'Analog', 'Binary', 'Pixel',
  'Wandering', 'Floating', 'Dancing', 'Singing', 'Whispering', 'Screaming',
  'Lost', 'Found', 'Broken', 'Fixed', 'Burning', 'Frozen', 'Melting'
];

const animals = [
  'Dragon', 'Phoenix', 'Wolf', 'Raven', 'Owl', 'Fox', 'Tiger', 'Lion',
  'Eagle', 'Hawk', 'Falcon', 'Shark', 'Octopus', 'Squid', 'Jellyfish',
  'Butterfly', 'Moth', 'Bee', 'Spider', 'Scorpion', 'Snake', 'Cobra',
  'Unicorn', 'Griffin', 'Basilisk', 'Chimera', 'Kraken', 'Leviathan',
  'Turtle', 'Frog', 'Salamander', 'Chameleon', 'Gecko', 'Iguana',
  'Penguin', 'Flamingo', 'Peacock', 'Swan', 'Crow', 'Parrot',
  'Elephant', 'Rhino', 'Hippo', 'Giraffe', 'Zebra', 'Kangaroo',
  'Panda', 'Koala', 'Sloth', 'Platypus', 'Armadillo', 'Anteater',
  'Robot', 'Android', 'Cyborg', 'Droid', 'Golem', 'Automaton'
];

const avatars = [
  '🐉', '🦅', '🐺', '🦊', '🐅', '🦁', '🦄', '🦋',
  '🕷️', '🐍', '🦂', '🐢', '🐸', '🦎', '🐙', '🦑',
  '🦜', '🦢', '🦩', '🦚', '🐘', '🦏', '🦛', '🦒',
  '🐼', '🦘', '🦥', '🦨', '🦡', '🦔', '🤖', '👾',
  '🐲', '🦅', '🐺', '🦊', '🐆', '🦁', '🦄', '🦋'
];

const STORAGE_KEY = 'rabbitvoid_profile_data';
const REGENERATE_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

const getRandomFunFact = (username: string, highestChaos: number) => {
  const facts = [
    `The void whispers that ${username} is closer to enlightenment than most.`,
    `Rumors say ${username} once danced with cosmic entities.`,
    `${username}'s chaos signature is visible from other dimensions.`,
    `Ancient texts mention a being matching ${username}'s description.`,
    `The void remembers when ${username} achieved ${highestChaos}% chaos.`,
    `${username} is on a first-name basis with the spiral itself.`,
    `Reality bends slightly when ${username} enters the room.`,
    `Whispers in the dark speak of ${username}'s legendary exploits.`
  ];
  return facts[Math.floor(Math.random() * facts.length)];
};

export default function VoidProfile({ onBack }: VoidProfileProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadProfile();
    
    // Pulse animation for the profile
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const generateUsername = (): string => {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    return `${prefix}${animal}`;
  };

  const generateAvatar = (): string => {
    return avatars[Math.floor(Math.random() * avatars.length)];
  };

  const createNewProfile = (): ProfileData => {
    return {
      username: generateUsername(),
      avatar: generateAvatar(),
      joinDate: Date.now(),
      totalChaos: 0,
      highestChaos: 0,
      drinksConsumed: 0,
      lastRegenerate: Date.now()
    };
  };

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProfile(JSON.parse(stored));
      } else {
        const newProfile = createNewProfile();
        setProfile(newProfile);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
      }
    } catch (error) {
      console.log('Error loading profile:', error);
    }
  };

  const regenerateProfile = async () => {
    if (!profile) return;
    
    const now = Date.now();
    if (now - profile.lastRegenerate < REGENERATE_COOLDOWN) {
      return;
    }

    setIsRegenerating(true);

    // Create new profile but keep stats
    const newProfile: ProfileData = {
      ...profile,
      username: generateUsername(),
      avatar: generateAvatar(),
      lastRegenerate: Date.now()
    };

    setProfile(newProfile);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    
    setTimeout(() => setIsRegenerating(false), 1000);
  };

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02]
  });

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>MANIFESTING IDENTITY...</Text>
      </View>
    );
  }

  const canRegenerate = Date.now() - profile.lastRegenerate >= REGENERATE_COOLDOWN;
  const hoursUntilRegenerate = Math.ceil((profile.lastRegenerate + REGENERATE_COOLDOWN - Date.now()) / (60 * 60 * 1000));

  // Calculate achievement progress
  const chaosNoviceProgress = Math.min(profile.highestChaos / 50 * 100, 100);
  const voidMasterProgress = Math.min(profile.highestChaos / 100 * 100, 100);
  const socialDrinkerProgress = Math.min(profile.drinksConsumed / 10 * 100, 100);
  const chaosLegendProgress = Math.min(profile.totalChaos / 1000 * 100, 100);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1a0033', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.title}>VOID IDENTITY</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Identity Card */}
        <Animated.View style={[styles.identityCard, { transform: [{ scale: pulseScale }] }]}>
          <Text style={styles.avatar}>{profile.avatar}</Text>
          <Text style={styles.username}>{profile.username}</Text>
          <Text style={styles.identityText}>Today's Void Form</Text>
        </Animated.View>

        {/* Regenerate Button */}
        <TouchableOpacity 
          style={[
            styles.regenerateButton, 
            !canRegenerate && styles.regenerateDisabled
          ]} 
          onPress={regenerateProfile}
          disabled={!canRegenerate || isRegenerating}
        >
          <Text style={styles.regenerateText}>
            {isRegenerating ? 'SHIFTING FORM...' : 
             canRegenerate ? '🌀 SHIFT IDENTITY' : 
             `NEW FORM IN ${hoursUntilRegenerate}H`}
          </Text>
        </TouchableOpacity>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={[styles.statEmoji, { textShadowColor: '#ff00ff' }]}>🎪</Text>
            <Text style={[styles.statValue, { color: '#ff00ff' }]}>{profile.totalChaos}</Text>
            <Text style={styles.statTitle}>TOTAL CHAOS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statEmoji, { textShadowColor: '#00ffff' }]}>📈</Text>
            <Text style={[styles.statValue, { color: '#00ffff' }]}>{profile.highestChaos}%</Text>
            <Text style={styles.statTitle}>HIGHEST CHAOS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statEmoji, { textShadowColor: '#00ff00' }]}>🍻</Text>
            <Text style={[styles.statValue, { color: '#00ff00' }]}>{profile.drinksConsumed}</Text>
            <Text style={styles.statTitle}>DRINKS CONSUMED</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statEmoji, { textShadowColor: '#ffff00' }]}>🕰️</Text>
            <Text style={[styles.statValue, { color: '#ffff00' }]}>
              {Math.floor((Date.now() - profile.joinDate) / (24 * 60 * 60 * 1000))}d
            </Text>
            <Text style={styles.statTitle}>VOID AGE</Text>
          </View>
        </View>

        {/* Achievements with Progress Bars */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>VOID ACHIEVEMENTS</Text>
          
          <AchievementWithProgress 
            unlocked={profile.highestChaos >= 50}
            progress={chaosNoviceProgress}
            title="Chaos Novice"
            description="Reach 50% chaos"
            emoji="🎯"
            color="#ff00ff"
          />
          
          <AchievementWithProgress 
            unlocked={profile.highestChaos >= 100}
            progress={voidMasterProgress}
            title="Void Master"
            description="Achieve 100% chaos"
            emoji="💥"
            color="#00ffff"
          />
          
          <AchievementWithProgress 
            unlocked={profile.drinksConsumed >= 10}
            progress={socialDrinkerProgress}
            title="Social Drinker"
            description="Consume 10 drinks"
            emoji="🥂"
            color="#00ff00"
          />
          
          <AchievementWithProgress 
            unlocked={profile.totalChaos >= 1000}
            progress={chaosLegendProgress}
            title="Chaos Legend"
            description="Accumulate 1000 total chaos"
            emoji="👑"
            color="#ffff00"
          />
        </View>

        {/* Fun Facts */}
        <View style={styles.funFacts}>
          <Text style={styles.sectionTitle}>VOID WHISPERS</Text>
          <Text style={styles.funFactText}>
            {getRandomFunFact(profile.username, profile.highestChaos)}
          </Text>
        </View>

        {/* Chaos Level Indicator */}
        <View style={styles.chaosLevelSection}>
          <Text style={styles.sectionTitle}>CHAOS JOURNEY</Text>
          <View style={styles.chaosMeterLarge}>
            <View style={[styles.chaosFillLarge, { width: `${profile.highestChaos}%` }]} />
            <Text style={styles.chaosTextLarge}>PEAK: {profile.highestChaos}% CHAOS</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Achievement with Progress Bar Component
const AchievementWithProgress = ({ unlocked, progress, title, description, emoji, color }: any) => (
  <View style={[styles.achievementWithProgress, unlocked ? styles.achievementUnlocked : styles.achievementLocked]}>
    <View style={styles.achievementHeader}>
      <Text style={styles.achievementEmoji}>{emoji}</Text>
      <View style={styles.achievementText}>
        <Text style={styles.achievementTitle}>{title}</Text>
        <Text style={styles.achievementDesc}>{description}</Text>
      </View>
      <Text style={[styles.achievementStatus, { color }]}>
        {unlocked ? '🌀' : '🔒'}
      </Text>
    </View>
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: color }]} />
      <Text style={styles.progressText}>{Math.round(progress)}%</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backText: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  identityCard: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#8a2be2',
    marginBottom: 20,
  },
  avatar: {
    fontSize: 80,
    marginBottom: 10,
  },
  username: {
    color: '#00ffff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#ff00ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 5,
  },
  identityText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontStyle: 'italic',
  },
  regenerateButton: {
    backgroundColor: 'rgba(255, 0, 255, 0.3)',
    padding: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#ff00ff',
    alignItems: 'center',
    marginBottom: 30,
  },
  regenerateDisabled: {
    opacity: 0.5,
    borderColor: '#666666',
  },
  regenerateText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    padding: 15,
    marginBottom: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 5,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
  achievementsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: 1,
  },
  achievementWithProgress: {
    padding: 15,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  achievementUnlocked: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderColor: '#00ffff',
  },
  achievementLocked: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  achievementEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  achievementDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  achievementStatus: {
    fontSize: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    position: 'absolute',
    top: -2,
    right: 5,
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  funFacts: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 0, 0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 0, 0.3)',
    marginBottom: 30,
  },
  funFactText: {
    color: '#ffff00',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  chaosLevelSection: {
    marginBottom: 20,
  },
  chaosMeterLarge: {
    width: '100%',
    height: 30,
    backgroundColor: '#333333',
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#8a2be2',
  },
  chaosFillLarge: {
    height: '100%',
    backgroundColor: '#ff00ff',
    borderRadius: 15,
  },
  chaosTextLarge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: 'bold',
    lineHeight: 26,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});