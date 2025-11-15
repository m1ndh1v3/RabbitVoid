import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ChillZoneProps {
  onBack: () => void;
  onNavigateToGame: (gameScreen: string) => void;
}

export default function ChillZone({ onBack, onNavigateToGame }: ChillZoneProps) {
  const games = [
    {
      id: 'diceDuel',
      title: '🎲 DICE DUEL',
      description: 'Classic dice battle with psychedelic twists',
      color: '#ffff00',
      comingSoon: false
    },
    {
      id: 'staringContest', 
      title: '👁️ VOID STARING CONTEST',
      description: 'Stare into the abyss - first to blink loses!',
      color: '#00ffff',
      comingSoon: false
    },
    {
      id: 'truthOrDare',
      title: '🎪 TRUTH OR DARE: VOID EDITION',
      description: 'Psychedelic truths & cosmic dares',
      color: '#ff00ff',
      comingSoon: true
    },
    {
      id: 'realityTelephone',
      title: '🌀 REALITY TELEPHONE',
      description: 'Whisper secrets through the void - watch them distort!',
      color: '#00ff00',
      comingSoon: true
    },
    {
      id: 'voidCharades',
      title: '👻 VOID CHARADES',
      description: 'Act out surreal prompts with trippy visuals',
      color: '#ff0000',
      comingSoon: true
    },
    {
      id: 'cardOfChaos',
      title: '🎴 CARD OF CHAOS',
      description: 'Drawing game where reality warps with each card',
      color: '#8a2be2',
      comingSoon: true
    }
  ];

  const handleGamePress = (gameId: string, comingSoon: boolean) => {
    if (!comingSoon) {
      onNavigateToGame(gameId);
    }
  };

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
        <Text style={styles.title}>CHILLZONE</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>🌀 REALITY-DISTORTING GAMES 🌀</Text>
        <Text style={styles.description}>
          Where digital madness meets physical interaction.{'\n'}
          Perfect for altered states of consciousness.
        </Text>

        {/* Game Grid */}
        <View style={styles.gamesGrid}>
          {games.map((game, index) => (
            <GameCard
              key={game.id}
              title={game.title}
              description={game.description}
              color={game.color}
              comingSoon={game.comingSoon}
              onPress={() => handleGamePress(game.id, game.comingSoon)}
            />
          ))}
        </View>

        {/* Active Games Counter */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            🎮 {games.filter(g => !g.comingSoon).length} GAMES READY • 
            🌀 {games.filter(g => g.comingSoon).length} COMING SOON
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const GameCard = ({ title, description, color, comingSoon, onPress }: any) => (
  <TouchableOpacity 
    style={[
      styles.gameCard, 
      comingSoon ? styles.comingSoonCard : styles.availableCard
    ]}
    onPress={onPress}
    disabled={comingSoon}
  >
    <Text style={[styles.gameTitle, { color }]}>{title}</Text>
    <Text style={styles.gameDescription}>{description}</Text>
    {comingSoon ? (
      <View style={styles.statusContainer}>
        <Text style={styles.comingSoonText}>🌀 COMING SOON 🌀</Text>
      </View>
    ) : (
      <View style={styles.statusContainer}>
        <Text style={styles.playText}>🎮 TAP TO PLAY →</Text>
      </View>
    )}
  </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: '#ff00ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  description: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  gamesGrid: {
    width: '100%',
  },
  gameCard: {
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    marginBottom: 15,
    alignItems: 'center',
  },
  availableCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  comingSoonCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    opacity: 0.7,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  gameDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 16,
  },
  statusContainer: {
    marginTop: 5,
  },
  comingSoonText: {
    color: '#ffff00',
    fontSize: 10,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  playText: {
    color: '#00ff00',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsContainer: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#8a2be2',
    marginTop: 20,
    alignItems: 'center',
  },
  statsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});