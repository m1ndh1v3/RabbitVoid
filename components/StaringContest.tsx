import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Easing, Vibration } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface StaringContestProps {
  onBack: () => void;
}

type GameState = 'setup' | 'countdown' | 'playing' | 'blinked' | 'winner' | 'tie';

export default function StaringContest({ onBack }: StaringContestProps) {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [players, setPlayers] = useState([
    { id: 1, name: 'PLAYER 1', blinked: false, time: 0, avatar: '👤' },
    { id: 2, name: 'PLAYER 2', blinked: false, time: 0, avatar: '👤' }
  ]);
  const [countdown, setCountdown] = useState(3);
  const [gameTime, setGameTime] = useState(0);
  const [winner, setWinner] = useState<number | null>(null);

  // Animations - FIXED: Added initial values
  const [spiralRotate] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(0));
  const [intensityAnim] = useState(new Animated.Value(0));
  const [glitchAnim] = useState(new Animated.Value(0));
  const [countdownScale] = useState(new Animated.Value(1));
  const [player1Blink] = useState(new Animated.Value(0));
  const [player2Blink] = useState(new Animated.Value(0));

  // Refs
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Spiral rotation animation
  useEffect(() => {
    if (gameState === 'playing') {
      Animated.loop(
        Animated.timing(spiralRotate, {
          toValue: 1,
          duration: 3000 - (gameTime * 50), // Speed up over time
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spiralRotate.setValue(0);
    }
  }, [gameState, gameTime]);

  // Intensity pulse animation
  useEffect(() => {
    if (gameState === 'playing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000 - (gameTime * 30),
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 2000 - (gameTime * 30),
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Increase intensity over time
      Animated.timing(intensityAnim, {
        toValue: 1,
        duration: 30000, // 30 seconds to max intensity
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    } else {
      pulseAnim.setValue(0);
      intensityAnim.setValue(0);
    }
  }, [gameState, gameTime]);

  // Random glitch effects
  useEffect(() => {
    if (gameState === 'playing' && gameTime > 10) {
      const glitchInterval = setInterval(() => {
        if (Math.random() > 0.7) {
          Animated.sequence([
            Animated.timing(glitchAnim, {
              toValue: 1,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(glitchAnim, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }),
          ]).start();
        }
      }, 2000);

      return () => clearInterval(glitchInterval);
    }
  }, [gameState, gameTime]);

  const startCountdown = () => {
    setGameState('countdown');
    setCountdown(3);
    
    // Countdown animation
    Animated.sequence([
      Animated.timing(countdownScale, {
        toValue: 1.5,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(countdownScale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          startGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startGame = () => {
    setGameState('playing');
    setGameTime(0);
    setPlayers(prev => prev.map(p => ({ ...p, blinked: false, time: 0 })));
    setWinner(null);
    
    // Start game timer
    gameTimerRef.current = setInterval(() => {
      setGameTime(prev => prev + 1);
    }, 1000);
  };

  const playerBlink = (playerId: number) => {
    if (gameState !== 'playing') return;
    
    Vibration.vibrate(500);
    
    const blinkAnim = playerId === 1 ? player1Blink : player2Blink;
    
    // Blink animation
    Animated.sequence([
      Animated.timing(blinkAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(blinkAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const updatedPlayers = players.map(p => 
      p.id === playerId 
        ? { ...p, blinked: true, time: gameTime }
        : p
    );
    
    setPlayers(updatedPlayers);
    setGameState('blinked');
    
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
    }

    // Determine winner after short delay
    setTimeout(() => {
      const otherPlayer = updatedPlayers.find(p => p.id !== playerId);
      if (otherPlayer && !otherPlayer.blinked) {
        setWinner(otherPlayer.id);
        setGameState('winner');
      } else {
        setGameState('tie');
      }
    }, 1500);
  };

  const resetGame = () => {
    setGameState('setup');
    setCountdown(3);
    setGameTime(0);
    setWinner(null);
    
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    // Reset animations
    spiralRotate.setValue(0);
    pulseAnim.setValue(0);
    intensityAnim.setValue(0);
    glitchAnim.setValue(0);
    countdownScale.setValue(1);
    player1Blink.setValue(0);
    player2Blink.setValue(0);
  };

  // Animation interpolations
  const spiralRotation = spiralRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8]
  });

  const intensityScale = intensityAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3]
  });

  const glitchTranslateX = glitchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.random() * 20 - 10]
  });

  const blinkOpacity = (blinkAnim: Animated.Value) => 
    blinkAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.3]
    });

  // FIXED: Properly type the color arrays
  const getIntensityColor = (): [string, string, string] => {
    if (gameTime < 10) return ['#000000', '#0000ff', '#ff00ff'];
    if (gameTime < 20) return ['#000000', '#ff0000', '#ffff00'];
    return ['#000000', '#00ff00', '#ff00ff'];
  };

  // Render different screens based on game state
  if (gameState === 'setup') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#000000', '#1a0033', '#000000']}
          style={StyleSheet.absoluteFillObject}
        />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← BACK</Text>
          </TouchableOpacity>
          <Text style={styles.title}>VOID STARING CONTEST</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.setupContainer}>
          <Text style={styles.setupTitle}>👁️ THE ULTIMATE BLINK TEST 👁️</Text>
          <Text style={styles.setupDescription}>
            Stare into the swirling void.{'\n'}
            First to blink loses.{'\n'}
            Reality distortion increases over time.
          </Text>

          <View style={styles.playersSetup}>
            {players.map(player => (
              <View key={player.id} style={styles.playerSetupCard}>
                <Text style={styles.playerAvatar}>{player.avatar}</Text>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerReady}>READY TO STARE</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startCountdown}>
            <Text style={styles.startButtonText}>🌀 BEGIN STARING CONTEST 🌀</Text>
          </TouchableOpacity>

          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>HOW TO PLAY:</Text>
            <Text style={styles.instructionsText}>
              • Each player stares at the spiral{'\n'}
              • Tap your side when you blink{'\n'}
              • Last one staring wins{'\n'}
              • Drink penalty for the blinker! 🍻
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (gameState === 'countdown') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#000000', '#ff0000', '#000000']}
          style={StyleSheet.absoluteFillObject}
        />
        
        <Animated.View style={[styles.countdownContainer, { transform: [{ scale: countdownScale }] }]}>
          <Text style={styles.countdownText}>{countdown || 'STARE!'}</Text>
          <Text style={styles.countdownSubtext}>DON'T BLINK</Text>
        </Animated.View>
      </View>
    );
  }

  if (gameState === 'winner' || gameState === 'tie') {
    const resultColors: [string, string, string] = 
      gameState === 'winner' ? ['#000000', '#00ff00', '#000000'] : ['#000000', '#ffff00', '#000000'];
    
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={resultColors}
          style={StyleSheet.absoluteFillObject}
        />
        
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>
            {gameState === 'winner' ? '🏆 CONTEST OVER! 🏆' : '🎪 COSMIC TIE! 🎪'}
          </Text>
          
          {gameState === 'winner' && winner && (
            <Text style={styles.winnerText}>
              {players.find(p => p.id === winner)?.name} WINS!
            </Text>
          )}

          <Text style={styles.timeText}>
            TIME: {gameTime} SECONDS
          </Text>

          <View style={styles.playerResults}>
            {players.map(player => (
              <View key={player.id} style={[
                styles.playerResult,
                player.id === winner && styles.winnerResult
              ]}>
                <Text style={styles.playerResultAvatar}>{player.avatar}</Text>
                <Text style={styles.playerResultName}>{player.name}</Text>
                <Text style={styles.playerResultStatus}>
                  {player.blinked ? `BLINKED AT ${player.time}s` : 'STOOD STRONG'}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.playAgainButton} onPress={resetGame}>
              <Text style={styles.playAgainText}>🔄 PLAY AGAIN</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} onPress={onBack}>
              <Text style={styles.menuText}>← BACK TO CHILLZONE</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.penaltyText}>
            {gameState === 'winner' ? '👁️ BLINKER DRINKS! 🍻' : '🤝 BOTH PLAYERS DRINK! 🍻'}
          </Text>
        </View>
      </View>
    );
  }

  // Main game screen
  const intensityColors = getIntensityColor();
  
  return (
    <View style={styles.container}>
      {/* Animated Background */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { 
        transform: [{ scale: intensityScale }],
        opacity: pulseOpacity 
      }]}>
        <LinearGradient
          colors={intensityColors}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Glitch Overlay */}
      <Animated.View style={[
        StyleSheet.absoluteFillObject,
        { 
          backgroundColor: '#00ffff',
          opacity: glitchAnim,
          transform: [{ translateX: glitchTranslateX }]
        }
      ]} />

      {/* Spiral Pattern */}
      <View style={styles.spiralContainer}>
        <Animated.View style={[
          styles.spiral,
          { transform: [{ rotate: spiralRotation }] }
        ]}>
          <Text style={styles.spiralText}>🌀</Text>
        </Animated.View>
        
        {/* Intensity Indicator */}
        <View style={styles.intensityMeter}>
          <View style={[styles.intensityFill, { width: `${(gameTime / 30) * 100}%` }]} />
          <Text style={styles.intensityText}>
            REALITY DISTORTION: {Math.min(Math.floor((gameTime / 30) * 100), 100)}%
          </Text>
        </View>
      </View>

      {/* Player Areas */}
      <View style={styles.playersContainer}>
        {/* Player 1 */}
        <Animated.View style={[styles.playerArea, { opacity: blinkOpacity(player1Blink) }]}>
          <TouchableOpacity 
            style={styles.blinkButton}
            onPress={() => playerBlink(1)}
            disabled={gameState !== 'playing'}
          >
            <Text style={styles.playerAvatar}>👤</Text>
            <Text style={styles.playerName}>PLAYER 1</Text>
            <Text style={styles.blinkText}>TAP WHEN YOU BLINK</Text>
            {players[0].blinked && (
              <Text style={styles.blinkedText}>BLINKED! 🎪</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* VS Separator */}
        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>⚡</Text>
          <Text style={styles.timeDisplay}>{gameTime}s</Text>
        </View>

        {/* Player 2 */}
        <Animated.View style={[styles.playerArea, { opacity: blinkOpacity(player2Blink) }]}>
          <TouchableOpacity 
            style={styles.blinkButton}
            onPress={() => playerBlink(2)}
            disabled={gameState !== 'playing'}
          >
            <Text style={styles.playerAvatar}>👤</Text>
            <Text style={styles.playerName}>PLAYER 2</Text>
            <Text style={styles.blinkText}>TAP WHEN YOU BLINK</Text>
            {players[1].blinked && (
              <Text style={styles.blinkedText}>BLINKED! 🎪</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Game Info */}
      <View style={styles.gameInfo}>
        <Text style={styles.gameInfoText}>
          {gameState === 'blinked' ? 'CONTEST ENDING...' : 'STARE INTO THE SPIRAL'}
        </Text>
      </View>
    </View>
  );
}

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
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  setupTitle: {
    color: '#00ffff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: '#ff00ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  setupDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  playersSetup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
  },
  playerSetupCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#00ffff',
    width: '45%',
  },
  playerAvatar: {
    fontSize: 40,
    marginBottom: 10,
  },
  playerName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  playerReady: {
    color: '#00ff00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: 'rgba(255, 0, 255, 0.3)',
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#ff00ff',
    marginBottom: 30,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  instructions: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#8a2be2',
  },
  instructionsTitle: {
    color: '#ffff00',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  instructionsText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  countdownContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    color: '#ffffff',
    fontSize: 100,
    fontWeight: 'bold',
    textShadowColor: '#ff0000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  countdownSubtext: {
    color: '#ffff00',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  spiralContainer: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  spiral: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spiralText: {
    fontSize: 120,
  },
  intensityMeter: {
    position: 'absolute',
    bottom: -60,
    width: '80%',
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  intensityFill: {
    height: '100%',
    backgroundColor: '#ff00ff',
    borderRadius: 10,
  },
  intensityText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  playersContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: '60%',
  },
  playerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blinkButton: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 255, 255, 0.2)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00ffff',
    minWidth: 140,
  },
  blinkText: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  blinkedText: {
    color: '#ff0000',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  vsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  vsText: {
    color: '#ffff00',
    fontSize: 30,
    fontWeight: 'bold',
  },
  timeDisplay: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  gameInfo: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  gameInfoText: {
    color: '#ffff00',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  resultTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: '#ffff00',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  winnerText: {
    color: '#00ff00',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  timeText: {
    color: '#00ffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  playerResults: {
    width: '100%',
    marginBottom: 30,
  },
  playerResult: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    marginBottom: 10,
  },
  winnerResult: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    borderWidth: 2,
    borderColor: '#00ff00',
  },
  playerResultAvatar: {
    fontSize: 24,
    marginRight: 15,
  },
  playerResultName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  playerResultStatus: {
    color: '#ffff00',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultActions: {
    width: '100%',
    marginBottom: 20,
  },
  playAgainButton: {
    backgroundColor: 'rgba(0, 255, 255, 0.3)',
    padding: 20,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#00ffff',
    alignItems: 'center',
    marginBottom: 15,
  },
  playAgainText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuButton: {
    backgroundColor: 'rgba(255, 0, 255, 0.3)',
    padding: 15,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ff00ff',
    alignItems: 'center',
  },
  menuText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  penaltyText: {
    color: '#ff0000',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
});