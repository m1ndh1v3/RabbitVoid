import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface DiceDuelProps {
  onBack: () => void;
}

interface Player {
  name: string;
  avatar: string;
  roll: number;
  isRolling: boolean;
  wins: number;
}

// Psychedelic dice symbols and colors
const DICE_SYMBOLS = ['🌀', '⚡', '💫', '🌌', '✨', '💥'];
const DICE_COLORS = ['#ff00ff', '#00ffff', '#ffff00', '#00ff00', '#ff0000', '#8a2be2'];

const MAX_ROUNDS = 5; // Game ends after 5 rounds

export default function DiceDuel({ onBack }: DiceDuelProps) {
  const [players, setPlayers] = useState<Player[]>([
    { name: 'VOID WALKER', avatar: '👤', roll: 0, isRolling: false, wins: 0 },
    { name: 'CHAOS BEING', avatar: '👤', roll: 0, isRolling: false, wins: 0 }
  ]);
  const [gameState, setGameState] = useState<'idle' | 'rolling' | 'result' | 'gameOver'>('idle');
  const [round, setRound] = useState(1);
  const [winner, setWinner] = useState<number | null>(null);
  const [chaosLevel, setChaosLevel] = useState(0);
  const [finalWinner, setFinalWinner] = useState<number | null>(null);

  // Animations
  const [diceScale1] = useState(new Animated.Value(1));
  const [diceScale2] = useState(new Animated.Value(1));
  const [glitchAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(0));
  const [resultScale] = useState(new Animated.Value(0));
  const [rollRotation1] = useState(new Animated.Value(0));
  const [rollRotation2] = useState(new Animated.Value(0));
  const [diceThrow1] = useState(new Animated.Value(0));
  const [diceThrow2] = useState(new Animated.Value(0));
  const [endGameAnim] = useState(new Animated.Value(0));

  // Dice throw simulation - bouncing animation
  const simulateDiceThrow = (throwAnim: Animated.Value) => {
    return Animated.sequence([
      Animated.timing(throwAnim, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(throwAnim, {
        toValue: 0.6,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(throwAnim, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(throwAnim, {
        toValue: 0.8,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(throwAnim, {
        toValue: 1,
        duration: 60,
        useNativeDriver: true,
      }),
    ]);
  };
  
  const rollDice = (playerIndex: number) => {
    if (gameState === 'rolling' || players[playerIndex].roll > 0) return;

    setPlayers(prev => prev.map((p, i) => 
      i === playerIndex ? { ...p, isRolling: true } : p
    ));
    
    setGameState('rolling');

    // Dice roll animation
    const scaleAnim = playerIndex === 0 ? diceScale1 : diceScale2;
    const rotationAnim = playerIndex === 0 ? rollRotation1 : rollRotation2;
    const throwAnim = playerIndex === 0 ? diceThrow1 : diceThrow2;

    Animated.parallel([
      // Scale animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      // Rotation animation
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      // Throw/bounce animation
      simulateDiceThrow(throwAnim)
    ]).start();

    // Simulate dice roll with random results
    let rollProgress = 0;
    const rollInterval = setInterval(() => {
      rollProgress += 1;
      // Show random numbers during roll for simulation effect
      if (rollProgress < 6) {
        const tempRoll = Math.floor(Math.random() * 6) + 1;
        setPlayers(prev => prev.map((p, i) => 
          i === playerIndex ? { ...p, roll: tempRoll } : p
        ));
      }
    }, 250);

    // Final roll result
    setTimeout(() => {
      clearInterval(rollInterval);
      const finalRoll = Math.floor(Math.random() * 6) + 1;
      setPlayers(prev => prev.map((p, i) => 
        i === playerIndex ? { ...p, roll: finalRoll, isRolling: false } : p
      ));

      // Check if both players have rolled
      const bothRolled = players.every((p, i) => 
        i === playerIndex ? true : p.roll > 0
      );

      if (bothRolled) {
        setTimeout(determineWinner, 500);
      } else {
        // Return to idle state so other player can roll
        setGameState('idle');
      }
    }, 1600);
  };

  const determineWinner = () => {
    const [p1, p2] = players;
    let newWinner: number | null = null;

    if (p1.roll > p2.roll) {
      newWinner = 0;
    } else if (p2.roll > p1.roll) {
      newWinner = 1;
    }

    setWinner(newWinner);
    
    // Update wins
    if (newWinner !== null) {
      setPlayers(prev => prev.map((p, i) => 
        i === newWinner ? { ...p, wins: p.wins + 1 } : p
      ));
    }

    // Check if game should end
    if (round >= MAX_ROUNDS) {
      endGame();
    } else {
      setGameState('result');
      
      // Result animation
      Animated.sequence([
        Animated.timing(resultScale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(resultScale, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    // Increase chaos level
    setChaosLevel(prev => Math.min(prev + 15, 100));
  };

  const endGame = () => {
    setGameState('gameOver');
    
    // Determine final winner
    const [p1, p2] = players;
    if (p1.wins > p2.wins) {
      setFinalWinner(0);
    } else if (p2.wins > p1.wins) {
      setFinalWinner(1);
    } else {
      setFinalWinner(null); // Tie
    }

    // End game animation
    Animated.sequence([
      Animated.timing(endGameAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(endGameAnim, {
        toValue: 0.8,
        duration: 3000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const nextRound = () => {
    if (round >= MAX_ROUNDS) {
      endGame();
      return;
    }

    setPlayers(prev => prev.map(p => ({ ...p, roll: 0, isRolling: false })));
    setGameState('idle');
    setWinner(null);
    setRound(prev => prev + 1);
    resultScale.setValue(0);
    rollRotation1.setValue(0);
    rollRotation2.setValue(0);
    diceThrow1.setValue(0);
    diceThrow2.setValue(0);
  };

  const resetGame = () => {
    setPlayers(prev => prev.map(p => ({ ...p, roll: 0, isRolling: false, wins: 0 })));
    setGameState('idle');
    setWinner(null);
    setFinalWinner(null);
    setRound(1);
    setChaosLevel(0);
    resultScale.setValue(0);
    rollRotation1.setValue(0);
    rollRotation2.setValue(0);
    diceThrow1.setValue(0);
    diceThrow2.setValue(0);
    endGameAnim.setValue(0);
  };

  // Animation interpolations
  const glitchTranslateX = glitchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.random() * 10 - 5]
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3]
  });

  const resultOpacity = resultScale.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  const rollRotate1 = rollRotation1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1080deg'] // More spins!
  });

  const rollRotate2 = rollRotation2.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1080deg'] // More spins!
  });

  const diceBounce1 = diceThrow1.interpolate({
    inputRange: [0, 0.5, 0.6, 0.7, 0.8, 1],
    outputRange: [0, -30, -20, -15, -10, 0]
  });

  const diceBounce2 = diceThrow2.interpolate({
    inputRange: [0, 0.5, 0.6, 0.7, 0.8, 1],
    outputRange: [0, -30, -20, -15, -10, 0]
  });

  const endGameScale = endGameAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5]
  });

  const endGameRotate = endGameAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Chaos effects at higher levels
  useEffect(() => {
    if (chaosLevel > 30) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glitchAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(glitchAnim, {
            toValue: 0,
            duration: 2000 - (chaosLevel * 15),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    if (chaosLevel > 50) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [chaosLevel]);

  // Game Over Screen
  if (gameState === 'gameOver') {
    return (
      <Animated.View style={[
        styles.container,
        {
          transform: [
            { scale: endGameScale },
            { rotate: endGameRotate }
          ]
        }
      ]}>
        <LinearGradient
          colors={['#ff0000', '#ff00ff', '#0000ff']}
          style={StyleSheet.absoluteFillObject}
        />
        
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverTitle}>🎪 GAME OVER 🎪</Text>
          <Text style={styles.gameOverSubtitle}>
            {finalWinner === null 
              ? 'COSMIC TIE! THE VOID IS CONFUSED' 
              : `🏆 ${players[finalWinner!].name} WINS THE DUEL! 🏆`}
          </Text>
          
          <View style={styles.finalScores}>
            <Text style={styles.finalScoreText}>
              {players[0].name}: {players[0].wins} WINS
            </Text>
            <Text style={styles.finalScoreText}>
              {players[1].name}: {players[1].wins} WINS
            </Text>
          </View>

          <Text style={styles.chaosFinalText}>
            FINAL CHAOS LEVEL: {chaosLevel}%
          </Text>

          <View style={styles.gameOverActions}>
            <TouchableOpacity style={styles.playAgainButton} onPress={resetGame}>
              <Text style={styles.playAgainText}>🔄 PLAY AGAIN</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} onPress={onBack}>
              <Text style={styles.menuText}>← MAIN MENU</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1a0033', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Chaos Effects Overlay */}
      <Animated.View style={[
        StyleSheet.absoluteFillObject,
        { 
          backgroundColor: '#ff00ff',
          opacity: pulseOpacity,
          transform: [{ translateX: glitchTranslateX }]
        }
      ]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.title}>VOID DICE DUEL</Text>
        <View style={styles.roundContainer}>
          <Text style={styles.roundText}>ROUND {round}/{MAX_ROUNDS}</Text>
        </View>
      </View>

      {/* Chaos Meter */}
      <View style={styles.chaosSection}>
        <Text style={styles.chaosTitle}>REALITY INSTABILITY</Text>
        <View style={styles.chaosMeter}>
          <View style={[styles.chaosFill, { width: `${chaosLevel}%` }]} />
          <Text style={styles.chaosText}>{chaosLevel}%</Text>
        </View>
      </View>

      {/* Win Counters */}
      <View style={styles.winCounters}>
        <View style={styles.winCounter}>
          <Text style={styles.winCounterName}>{players[0].name}</Text>
          <Text style={styles.winCounterWins}>{players[0].wins} WINS</Text>
        </View>
        <View style={styles.winCounter}>
          <Text style={styles.winCounterName}>{players[1].name}</Text>
          <Text style={styles.winCounterWins}>{players[1].wins} WINS</Text>
        </View>
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        {/* Player 1 */}
        <View style={styles.playerSection}>
          <Animated.View style={[
            styles.playerCard, 
            { 
              transform: [
                { scale: diceScale1 },
                { rotate: rollRotate1 },
                { translateY: diceBounce1 }
              ] 
            }
          ]}>
            <Text style={styles.playerAvatar}>{players[0].avatar}</Text>
            <Text style={styles.playerName}>{players[0].name}</Text>
            
            {players[0].roll > 0 ? (
              <View style={styles.rollResult}>
                <Text style={[
                  styles.rollSymbol, 
                  { 
                    color: DICE_COLORS[players[0].roll - 1],
                    textShadowColor: DICE_COLORS[players[0].roll - 1]
                  }
                ]}>
                  {DICE_SYMBOLS[players[0].roll - 1]}
                </Text>
                <Text style={styles.rollNumber}>{players[0].roll}</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={[
                  styles.rollButton,
                  (gameState === 'rolling' || players[0].roll > 0) && styles.rollButtonDisabled
                ]}
                onPress={() => rollDice(0)}
                disabled={gameState === 'rolling' || players[0].roll > 0}
              >
                <Text style={styles.rollButtonText}>
                  {players[0].isRolling ? '🌀 ROLLING...' : '🎲 ROLL DICE'}
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>

        {/* VS Separator */}
        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>⚡ VS ⚡</Text>
        </View>

        {/* Player 2 */}
        <View style={styles.playerSection}>
          <Animated.View style={[
            styles.playerCard, 
            { 
              transform: [
                { scale: diceScale2 },
                { rotate: rollRotate2 },
                { translateY: diceBounce2 }
              ] 
            }
          ]}>
            <Text style={styles.playerAvatar}>{players[1].avatar}</Text>
            <Text style={styles.playerName}>{players[1].name}</Text>
            
            {players[1].roll > 0 ? (
              <View style={styles.rollResult}>
                <Text style={[
                  styles.rollSymbol, 
                  { 
                    color: DICE_COLORS[players[1].roll - 1],
                    textShadowColor: DICE_COLORS[players[1].roll - 1]
                  }
                ]}>
                  {DICE_SYMBOLS[players[1].roll - 1]}
                </Text>
                <Text style={styles.rollNumber}>{players[1].roll}</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={[
                  styles.rollButton,
                  (gameState === 'rolling' || players[1].roll > 0) && styles.rollButtonDisabled
                ]}
                onPress={() => rollDice(1)}
                disabled={gameState === 'rolling' || players[1].roll > 0}
              >
                <Text style={styles.rollButtonText}>
                  {players[1].isRolling ? '🌀 ROLLING...' : '🎲 ROLL DICE'}
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </View>

      {/* Result Display */}
      {winner !== null && gameState === 'result' && (
        <Animated.View style={[
          styles.resultContainer,
          { 
            opacity: resultOpacity,
            transform: [{ scale: resultScale }]
          }
        ]}>
          <Text style={styles.resultTitle}>
            {winner === null ? '🎪 TIE! 🎪' : `🏆 ${players[winner].name} WINS! 🏆`}
          </Text>
          <Text style={styles.resultSubtitle}>
            {round >= MAX_ROUNDS ? 'FINAL ROUND!' : `ROUND ${round} COMPLETE`}
          </Text>
          
          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.nextButton} onPress={nextRound}>
              <Text style={styles.nextButtonText}>
                {round >= MAX_ROUNDS ? 'SEE RESULTS' : 'NEXT ROUND'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
              <Text style={styles.resetButtonText}>RESET GAME</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Chaos Effects at High Levels */}
      {chaosLevel > 50 && (
        <View style={styles.chaosOverlay} pointerEvents="none">
          <Text style={styles.chaosTextOverlay}>
            REALITY WARPING... {chaosLevel}%
          </Text>
        </View>
      )}

      {/* Game Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          🎲 {MAX_ROUNDS} ROUNDS • HIGHER NUMBER WINS • LOSER DRINKS 🍻
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
    paddingBottom: 10,
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
  roundContainer: {
    backgroundColor: 'rgba(255, 0, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ff00ff',
  },
  roundText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chaosSection: {
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  chaosTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  chaosMeter: {
    width: '100%',
    height: 12,
    backgroundColor: '#333333',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  chaosFill: {
    height: '100%',
    backgroundColor: '#ff00ff',
    borderRadius: 6,
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
    fontSize: 10,
    lineHeight: 12,
  },
  winCounters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginBottom: 10,
  },
  winCounter: {
    alignItems: 'center',
  },
  winCounterName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: 'bold',
  },
  winCounterWins: {
    color: '#ffff00',
    fontSize: 14,
    fontWeight: 'bold',
  },
  gameArea: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  playerSection: {
    flex: 1,
    alignItems: 'center',
  },
  playerCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    minWidth: 140,
  },
  playerAvatar: {
    fontSize: 40,
    marginBottom: 10,
  },
  playerName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  rollButton: {
    backgroundColor: 'rgba(0, 255, 255, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#00ffff',
  },
  rollButtonDisabled: {
    opacity: 0.3,
  },
  rollButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rollResult: {
    alignItems: 'center',
  },
  rollSymbol: {
    fontSize: 50,
    marginBottom: 5,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  rollNumber: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: '#8a2be2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  vsContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  vsText: {
    color: '#ffff00',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: '#ff00ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  resultContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(138, 43, 226, 0.9)',
    padding: 25,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#ff00ff',
    alignItems: 'center',
  },
  resultTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: '#ffff00',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  resultSubtitle: {
    color: '#ffff00',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  nextButton: {
    backgroundColor: 'rgba(0, 255, 255, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00ffff',
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ff0000',
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  chaosOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 255, 0.1)',
  },
  chaosTextOverlay: {
    color: '#ff00ff',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: '#00ffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    transform: [{ rotate: '-5deg' }],
  },
  instructions: {
    padding: 15,
    alignItems: 'center',
  },
  instructionsText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  gameOverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  gameOverTitle: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: '#ffff00',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  gameOverSubtitle: {
    color: '#ffff00',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  finalScores: {
    marginBottom: 20,
    alignItems: 'center',
  },
  finalScoreText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chaosFinalText: {
    color: '#ff00ff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 30,
    textShadowColor: '#00ffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  gameOverActions: {
    width: '100%',
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
});