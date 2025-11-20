import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  ScrollView, 
  Animated,
  Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from './AuthContext';

const { width, height } = Dimensions.get('window');

interface EnhancedVoidProfileProps {
  onBack: () => void;
}

interface ProfileStats {
  totalChaos: number;
  highestChaos: number;
  drinksConsumed: number;
  gamesPlayed: number;
  statusReports: number;
  verifiedReports: number;
  joinDate: number;
  lastRegenerate: number;
  achievements: {
    chaosNovice: boolean;
    voidMaster: boolean;
    socialDrinker: boolean;
    chaosLegend: boolean;
    pubExpert: boolean;
    truthSeeker: boolean;
    chessMaster: boolean;
  };
}

// Updated to match animals with emojis
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

// Animals with matching emojis
const animals = [
  { name: 'Dragon', emoji: '🐉' },
  { name: 'Phoenix', emoji: '🦅' },
  { name: 'Wolf', emoji: '🐺' },
  { name: 'Raven', emoji: '🐦‍⬛' },
  { name: 'Owl', emoji: '🦉' },
  { name: 'Fox', emoji: '🦊' },
  { name: 'Tiger', emoji: '🐅' },
  { name: 'Lion', emoji: '🦁' },
  { name: 'Eagle', emoji: '🦅' },
  { name: 'Hawk', emoji: '🦅' },
  { name: 'Falcon', emoji: '🦅' },
  { name: 'Shark', emoji: '🦈' },
  { name: 'Octopus', emoji: '🐙' },
  { name: 'Squid', emoji: '🦑' },
  { name: 'Jellyfish', emoji: '🎐' },
  { name: 'Butterfly', emoji: '🦋' },
  { name: 'Moth', emoji: '🦋' },
  { name: 'Bee', emoji: '🐝' },
  { name: 'Spider', emoji: '🕷️' },
  { name: 'Scorpion', emoji: '🦂' },
  { name: 'Snake', emoji: '🐍' },
  { name: 'Cobra', emoji: '🐍' },
  { name: 'Unicorn', emoji: '🦄' },
  { name: 'Griffin', emoji: '🦅' },
  { name: 'Basilisk', emoji: '🐍' },
  { name: 'Chimera', emoji: '🐲' },
  { name: 'Kraken', emoji: '🐙' },
  { name: 'Leviathan', emoji: '🐋' },
  { name: 'Turtle', emoji: '🐢' },
  { name: 'Frog', emoji: '🐸' },
  { name: 'Salamander', emoji: '🦎' },
  { name: 'Chameleon', emoji: '🦎' },
  { name: 'Gecko', emoji: '🦎' },
  { name: 'Iguana', emoji: '🦎' },
  { name: 'Penguin', emoji: '🐧' },
  { name: 'Flamingo', emoji: '🦩' },
  { name: 'Peacock', emoji: '🦚' },
  { name: 'Swan', emoji: '🦢' },
  { name: 'Crow', emoji: '🐦‍⬛' },
  { name: 'Parrot', emoji: '🦜' },
  { name: 'Elephant', emoji: '🐘' },
  { name: 'Rhino', emoji: '🦏' },
  { name: 'Hippo', emoji: '🦛' },
  { name: 'Giraffe', emoji: '🦒' },
  { name: 'Zebra', emoji: '🦓' },
  { name: 'Kangaroo', emoji: '🦘' },
  { name: 'Panda', emoji: '🐼' },
  { name: 'Koala', emoji: '🐨' },
  { name: 'Sloth', emoji: '🦥' },
  { name: 'Platypus', emoji: '🦆' },
  { name: 'Armadillo', emoji: '🦔' },
  { name: 'Anteater', emoji: '🐜' },
  { name: 'Robot', emoji: '🤖' },
  { name: 'Android', emoji: '🤖' },
  { name: 'Cyborg', emoji: '🤖' },
  { name: 'Droid', emoji: '🤖' },
  { name: 'Golem', emoji: '🗿' },
  { name: 'Automaton', emoji: '🤖' }
];

const REGENERATE_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

export default function EnhancedVoidProfile({ onBack }: EnhancedVoidProfileProps) {
  const { user, isAnonymous, register, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'achievements'>('profile');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(0));
  const [currentAvatar, setCurrentAvatar] = useState('🐺'); // Default avatar

  // Default stats - in real app, these would come from cloud
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    totalChaos: 42,
    highestChaos: 68,
    drinksConsumed: 7,
    gamesPlayed: 12,
    statusReports: 3,
    verifiedReports: 1,
    joinDate: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    lastRegenerate: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago to allow regeneration
    achievements: {
      chaosNovice: true,
      voidMaster: false,
      socialDrinker: true,
      chaosLegend: false,
      pubExpert: false,
      truthSeeker: true,
      chessMaster: false
    }
  });

  useEffect(() => {
    // Pulse animation
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

    // Set initial avatar based on current username
    if (user?.pub_alias) {
      const animalMatch = animals.find(animal => 
        user.pub_alias?.toLowerCase().includes(animal.name.toLowerCase())
      );
      if (animalMatch) {
        setCurrentAvatar(animalMatch.emoji);
      }
    }
  }, [user]);

  const generateUsername = (): { username: string, avatar: string } => {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    return {
      username: `${prefix}${animal.name}`,
      avatar: animal.emoji
    };
  };

  const regenerateIdentity = async () => {
    if (Date.now() - profileStats.lastRegenerate < REGENERATE_COOLDOWN) {
      const hoursLeft = Math.ceil((profileStats.lastRegenerate + REGENERATE_COOLDOWN - Date.now()) / (60 * 60 * 1000));
      Alert.alert('Patience, Wanderer', `New form available in ${hoursLeft} hours`);
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      'Shift Identity?',
      `Your current identity "${user?.pub_alias}" will be lost forever in the void. This cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Shift Form',
          style: 'destructive',
          onPress: async () => {
            setIsRegenerating(true);
            
            const newIdentity = generateUsername();
            
            if (isAnonymous) {
              // For anonymous users, just show the new identity temporarily
              Alert.alert(
                'New Identity Generated', 
                `You are now: ${newIdentity.username} ${newIdentity.avatar}\n\nCreate an account to save this identity permanently!`
              );
              setCurrentAvatar(newIdentity.avatar);
            } else {
              // For registered users, actually update their profile - FIXED: Only pass username
              await register(newIdentity.username);
              setCurrentAvatar(newIdentity.avatar);
            }

            setProfileStats(prev => ({
              ...prev,
              lastRegenerate: Date.now()
            }));

            setTimeout(() => setIsRegenerating(false), 1500);
          },
        },
      ]
    );
  };

  const getRandomFunFact = () => {
    const facts = [
      `The void whispers secrets only ${user?.pub_alias} can understand.`,
      `Rumors say ${user?.pub_alias} once danced with cosmic entities.`,
      `${user?.pub_alias}'s chaos signature is visible from other dimensions.`,
      `Ancient texts mention a being matching ${user?.pub_alias}'s description.`,
      `${user?.pub_alias} is on a first-name basis with the spiral itself.`,
      `Reality bends slightly when ${user?.pub_alias} enters the room.`,
      `Whispers in the dark speak of ${user?.pub_alias}'s legendary exploits.`,
      `${user?.pub_alias} has seen things that would break lesser minds.`
    ];
    return facts[Math.floor(Math.random() * facts.length)];
  };

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02]
  });

  const canRegenerate = Date.now() - profileStats.lastRegenerate >= REGENERATE_COOLDOWN;
  const hoursUntilRegenerate = Math.ceil((profileStats.lastRegenerate + REGENERATE_COOLDOWN - Date.now()) / (60 * 60 * 1000));

  // Calculate achievement progress
  const chaosNoviceProgress = Math.min(profileStats.highestChaos / 50 * 100, 100);
  const voidMasterProgress = Math.min(profileStats.highestChaos / 100 * 100, 100);
  const socialDrinkerProgress = Math.min(profileStats.drinksConsumed / 10 * 100, 100);
  const chaosLegendProgress = Math.min(profileStats.totalChaos / 1000 * 100, 100);
  const pubExpertProgress = Math.min(profileStats.verifiedReports / 5 * 100, 100);
  const truthSeekerProgress = Math.min(profileStats.gamesPlayed / 20 * 100, 100);

  const renderProfileTab = () => (
    <View style={styles.tabContent}>
      {/* Identity Card */}
      <Animated.View style={[styles.identityCard, { transform: [{ scale: pulseScale }] }]}>
        <Text style={styles.avatar}>{currentAvatar}</Text>
        <Text style={styles.username}>{user?.pub_alias || 'Unknown Wanderer'}</Text>
        <Text style={styles.userId}>ID: {user?.anonymous_id}</Text>
        
        <View style={styles.trustBadge}>
          <Text style={styles.trustText}>TRUST SCORE: {user?.trust_score || 50}</Text>
        </View>

        <Text style={styles.identityText}>
          {isAnonymous ? 'Anonymous Void Form' : 'Registered Void Identity'}
        </Text>
      </Animated.View>

      {/* Regenerate Button */}
      <TouchableOpacity 
        style={[
          styles.regenerateButton, 
          !canRegenerate && styles.regenerateDisabled
        ]} 
        onPress={regenerateIdentity}
        disabled={!canRegenerate || isRegenerating}
      >
        <Text style={styles.regenerateText}>
          {isRegenerating ? '🌀 SHIFTING FORM...' : 
           canRegenerate ? '🌀 SHIFT IDENTITY' : 
           `NEW FORM IN ${hoursUntilRegenerate}H`}
        </Text>
      </TouchableOpacity>

      {/* Status Info */}
      <View style={styles.statusInfo}>
        <Text style={styles.statusTitle}>UNDERGROUND STATUS</Text>
        <Text style={styles.statusText}>
          {isAnonymous 
            ? 'You move through the shadows. Your identity is protected and temporary.'
            : 'You have a registered underground alias. Your legacy grows with each report.'
          }
        </Text>
      </View>

      {!isAnonymous && (
        <TouchableOpacity style={styles.logoutButton} onPress={() => logout()}>
          <Text style={styles.logoutText}>GO ANONYMOUS</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderStatsTab = () => (
    <View style={styles.tabContent}>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={[styles.statEmoji, { textShadowColor: '#ff00ff' }]}>🎪</Text>
          <Text style={[styles.statValue, { color: '#ff00ff' }]}>{profileStats.totalChaos}</Text>
          <Text style={styles.statTitle}>TOTAL CHAOS</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statEmoji, { textShadowColor: '#00ffff' }]}>📈</Text>
          <Text style={[styles.statValue, { color: '#00ffff' }]}>{profileStats.highestChaos}%</Text>
          <Text style={styles.statTitle}>PEAK CHAOS</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statEmoji, { textShadowColor: '#00ff00' }]}>🍻</Text>
          <Text style={[styles.statValue, { color: '#00ff00' }]}>{profileStats.drinksConsumed}</Text>
          <Text style={styles.statTitle}>DRINKS</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statEmoji, { textShadowColor: '#ffff00' }]}>🎮</Text>
          <Text style={[styles.statValue, { color: '#ffff00' }]}>{profileStats.gamesPlayed}</Text>
          <Text style={styles.statTitle}>GAMES</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statEmoji, { textShadowColor: '#ff8800' }]}>🏪</Text>
          <Text style={[styles.statValue, { color: '#ff8800' }]}>{profileStats.statusReports}</Text>
          <Text style={styles.statTitle}>REPORTS</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statEmoji, { textShadowColor: '#8844ff' }]}>✅</Text>
          <Text style={[styles.statValue, { color: '#8844ff' }]}>{profileStats.verifiedReports}</Text>
          <Text style={styles.statTitle}>VERIFIED</Text>
        </View>
      </View>

      {/* Chaos Level Indicator */}
      <View style={styles.chaosLevelSection}>
        <Text style={styles.sectionTitle}>CHAOS JOURNEY</Text>
        <View style={styles.chaosMeterLarge}>
          <View style={[styles.chaosFillLarge, { width: `${profileStats.highestChaos}%` }]} />
          <Text style={styles.chaosTextLarge}>PEAK: {profileStats.highestChaos}% CHAOS</Text>
        </View>
      </View>

      {/* Fun Facts */}
      <View style={styles.funFacts}>
        <Text style={styles.sectionTitle}>VOID WHISPERS</Text>
        <Text style={styles.funFactText}>
          {getRandomFunFact()}
        </Text>
      </View>
    </View>
  );

  const renderAchievementsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>VOID ACHIEVEMENTS</Text>
      
      <AchievementWithProgress 
        unlocked={profileStats.achievements.chaosNovice}
        progress={chaosNoviceProgress}
        title="Chaos Novice"
        description="Reach 50% chaos"
        emoji="🎯"
        color="#ff00ff"
      />
      
      <AchievementWithProgress 
        unlocked={profileStats.achievements.voidMaster}
        progress={voidMasterProgress}
        title="Void Master"
        description="Achieve 100% chaos"
        emoji="💥"
        color="#00ffff"
      />
      
      <AchievementWithProgress 
        unlocked={profileStats.achievements.socialDrinker}
        progress={socialDrinkerProgress}
        title="Social Drinker"
        description="Consume 10 drinks"
        emoji="🥂"
        color="#00ff00"
      />
      
      <AchievementWithProgress 
        unlocked={profileStats.achievements.chaosLegend}
        progress={chaosLegendProgress}
        title="Chaos Legend"
        description="Accumulate 1000 total chaos"
        emoji="👑"
        color="#ffff00"
      />

      <AchievementWithProgress 
        unlocked={profileStats.achievements.pubExpert}
        progress={pubExpertProgress}
        title="Pub Expert"
        description="5 verified status reports"
        emoji="🏪"
        color="#ff8800"
      />

      <AchievementWithProgress 
        unlocked={profileStats.achievements.truthSeeker}
        progress={truthSeekerProgress}
        title="Truth Seeker"
        description="Play 20 games"
        emoji="🤔"
        color="#8844ff"
      />

      <AchievementWithProgress 
        unlocked={profileStats.achievements.chessMaster}
        progress={0}
        title="Chess Master"
        description="Win a chess game"
        emoji="♟️"
        color="#ffffff"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a0033', '#000000', '#1a0033']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>VOID PROFILE</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
            IDENTITY
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
            STATS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
          onPress={() => setActiveTab('achievements')}
        >
          <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>
            ACHIEVEMENTS
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'achievements' && renderAchievementsTab()}
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

// Styles remain exactly the same as previous version...
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
    paddingBottom: 15,
  },
  backButton: {
    padding: 10,
  },
  backText: {
    color: '#00ffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 4,
    borderRadius: 25,
  },
  activeTab: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderWidth: 1,
    borderColor: '#8a2be2',
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContent: {
    paddingBottom: 30,
  },
  identityCard: {
    alignItems: 'center',
    padding: 25,
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#8a2be2',
    marginBottom: 20,
  },
  avatar: {
    fontSize: 60,
    marginBottom: 10,
  },
  username: {
    color: '#00ffff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#ff00ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 5,
  },
  userId: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  trustBadge: {
    backgroundColor: 'rgba(0, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#00ffff',
    marginBottom: 10,
  },
  trustText: {
    color: '#00ffff',
    fontSize: 12,
    fontWeight: 'bold',
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
    marginBottom: 20,
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
  statusInfo: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  statusTitle: {
    color: '#ffff00',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  statusText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,0,0,0.3)',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ff0000',
    alignItems: 'center',
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
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
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 1,
  },
  chaosLevelSection: {
    marginBottom: 30,
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
  funFacts: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 0, 0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 0, 0.3)',
  },
  funFactText: {
    color: '#ffff00',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
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
});