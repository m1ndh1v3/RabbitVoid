import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Easing, Vibration } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface TruthOrDareProps {
  onBack: () => void;
}

type GameMode = 'truth' | 'dare' | 'voidChoice';
type CardType = 'truth' | 'dare' | 'chaos';

interface Card {
  id: string;
  type: CardType;
  text: string;
  chaosLevel: number;
  category: string;
}

export default function TruthOrDare({ onBack }: TruthOrDareProps) {
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'result'>('setup');
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('voidChoice');
  const [usedCards, setUsedCards] = useState<Set<string>>(new Set());
  const [chaosBoost, setChaosBoost] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);

  // Animations
  const [cardFlip] = useState(new Animated.Value(0));
  const [cardScale] = useState(new Animated.Value(1));
  const [glitchAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(0));
  const [voidPulse] = useState(new Animated.Value(0));
  const [instructionsOpacity] = useState(new Animated.Value(1));

  // Card database
  const cardDatabase: Card[] = [
    // TRUTH CARDS
    { id: 't1', type: 'truth', chaosLevel: 2, category: 'reality', text: "What's the most glitch-in-the-matrix moment you've experienced?" },
    { id: 't2', type: 'truth', chaosLevel: 3, category: 'psychedelic', text: "If you could see one color that doesn't exist, what would it look like?" },
    { id: 't3', type: 'truth', chaosLevel: 1, category: 'void', text: "What would your void counterpart do differently in your life?" },
    { id: 't4', type: 'truth', chaosLevel: 2, category: 'chaos', text: "What's the most chaotic thought you've had this week?" },
    { id: 't5', type: 'truth', chaosLevel: 3, category: 'reality', text: "If you could break one law of physics for a day, which would it be?" },

    // DARE CARDS
    { id: 'd1', type: 'dare', chaosLevel: 2, category: 'performance', text: "Do your best impression of reality glitching out for 30 seconds" },
    { id: 'd2', type: 'dare', chaosLevel: 3, category: 'chaos', text: "Let the void choose your next drink - no questions asked! 🍻" },
    { id: 'd3', type: 'dare', chaosLevel: 1, category: 'creative', text: "Describe the concept of 'time' to someone who's never experienced it" },
    { id: 'd4', type: 'dare', chaosLevel: 2, category: 'social', text: "Swap personalities with the person to your right for the next round" },
    { id: 'd5', type: 'dare', chaosLevel: 3, category: 'reality', text: "Act out what happens when you achieve 100% chaos in the void" },

    // CHAOS CARDS
    { id: 'c1', type: 'chaos', chaosLevel: 3, category: 'void', text: "VOID INTERVENTION: Everyone takes a drink! The void is watching... 🍻" },
    { id: 'c2', type: 'chaos', chaosLevel: 2, category: 'reality', text: "REALITY SHIFT: Swap truth/dare modes. The void is indecisive today!" },
    { id: 'c3', type: 'chaos', chaosLevel: 4, category: 'chaos', text: "CHAOS SURGE: Next 3 cards have +2 chaos levels. Embrace the madness! ⚡" },
  ];

  // Animation effects
  useEffect(() => {
    if (gameState === 'playing' && currentCard) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000 - (currentCard.chaosLevel * 200),
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 2000 - (currentCard.chaosLevel * 200),
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      if (currentCard.chaosLevel + chaosBoost >= 3) {
        const glitchInterval = setInterval(() => {
          if (Math.random() > 0.6) {
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
        }, 3000);
        return () => clearInterval(glitchInterval);
      }
    }
  }, [gameState, currentCard, chaosBoost]);

  const drawCard = (type?: CardType) => {
    Vibration.vibrate(100);
    
    let availableCards = cardDatabase;
    
    if (type && gameMode !== 'voidChoice') {
      availableCards = cardDatabase.filter(card => card.type === type);
    } else if (gameMode === 'truth') {
      availableCards = cardDatabase.filter(card => card.type === 'truth');
    } else if (gameMode === 'dare') {
      availableCards = cardDatabase.filter(card => card.type === 'dare');
    }

    availableCards = availableCards.filter(card => !usedCards.has(card.id));

    if (availableCards.length === 0) {
      const chaosCardsToKeep = new Set(
        cardDatabase.filter(card => card.type === 'chaos').map(card => card.id)
      );
      setUsedCards(chaosCardsToKeep);
      availableCards = cardDatabase.filter(card => chaosCardsToKeep.has(card.id));
    }

    if (availableCards.length === 0) return;

    const weightedCards: Card[] = [];
    availableCards.forEach(card => {
      const weight = card.chaosLevel + chaosBoost + 1;
      for (let i = 0; i < weight; i++) {
        weightedCards.push(card);
      }
    });

    const randomIndex = Math.floor(Math.random() * weightedCards.length);
    const selectedCard = weightedCards[randomIndex];

    // Reset flip state when drawing new card
    setIsFlipped(false);
    cardFlip.setValue(0);
    pulseAnim.setValue(0);
    
    setCurrentCard(selectedCard);
    setGameState('playing');
    setUsedCards(prev => new Set(prev).add(selectedCard.id));

    if (selectedCard.type === 'chaos') {
      handleChaosEffect(selectedCard);
    }
  };

  const flipCard = () => {
    if (!currentCard) {
      drawCard();
      return;
    }

    Vibration.vibrate(50);
    const toValue = isFlipped ? 0 : 1;
    
    Animated.spring(cardFlip, {
      toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
    
    setIsFlipped(!isFlipped);
  };

  const handleChaosEffect = (card: Card) => {
    switch (card.id) {
      case 'c2':
        setGameMode(prev => prev === 'truth' ? 'dare' : 'truth');
        break;
      case 'c3':
        setChaosBoost(prev => prev + 2);
        setTimeout(() => setChaosBoost(prev => prev - 2), 30000);
        break;
    }
  };

  const resetGame = () => {
    setGameState('setup');
    setCurrentCard(null);
    setUsedCards(new Set());
    setChaosBoost(0);
    setIsFlipped(false);
    cardFlip.setValue(0);
    pulseAnim.setValue(0);
    glitchAnim.setValue(0);
  };

  const setMode = (mode: GameMode) => {
    Vibration.vibrate(50);
    setGameMode(mode);
    Animated.sequence([
      Animated.timing(voidPulse, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(voidPulse, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideInstructions = () => {
    Animated.timing(instructionsOpacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => setShowInstructions(false));
  };

  // Animation interpolations
  const frontOpacity = cardFlip.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1]
  });

  const backOpacity = cardFlip.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0]
  });

  const frontScale = cardFlip.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 0.4, 1]
  });

  const backScale = cardFlip.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.4, 0.8]
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05]
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7]
  });

  const glitchTranslateX = glitchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.random() * 10 - 5]
  });

  const voidScale = voidPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1]
  });

  const getCardColor = (type: CardType) => {
    switch (type) {
      case 'truth': return '#00ffff';
      case 'dare': return '#ff00ff';
      case 'chaos': return '#ffff00';
      default: return '#8a2be2';
    }
  };

  const getCardGradient = (type: CardType): [string, string, string] => {
    switch (type) {
      case 'truth': return ['#000000', '#0066ff', '#00ffff'];
      case 'dare': return ['#000000', '#ff00ff', '#ff0066'];
      case 'chaos': return ['#000000', '#ffff00', '#ffaa00'];
      default: return ['#000000', '#8a2be2', '#4b0082'];
    }
  };

  if (gameState === 'setup') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#000000', '#1a0033', '#000000']} style={StyleSheet.absoluteFillObject} />

        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← BACK</Text>
          </TouchableOpacity>
          <Text style={styles.title}>TRUTH OR DARE: VOID EDITION</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.setupContainer}>
          <Text style={styles.setupTitle}>🎪 THE VOID WANTS TO PLAY 🎪</Text>
          <Text style={styles.setupDescription}>
            Choose your path through reality-bending truths and cosmic dares.
          </Text>

          {showInstructions && (
            <Animated.View style={[styles.instructionsOverlay, { opacity: instructionsOpacity }]}>
              <View style={styles.instructionsModal}>
                <Text style={styles.instructionsModalTitle}>🎪 HOW TO PLAY</Text>
                <Text style={styles.instructionsModalText}>
                  • Choose a mode or let the void decide{'\n'}
                  • Draw cards and tap to reveal{'\n'}
                  • Answer truthfully or complete the dare{'\n'}
                  • Chaos cards change the game rules!
                </Text>
                <TouchableOpacity style={styles.instructionsButton} onPress={hideInstructions}>
                  <Text style={styles.instructionsButtonText}>🌀 ENTER THE VOID 🌀</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          <Animated.View style={[styles.modeContainer, { transform: [{ scale: voidScale }] }]}>
            <TouchableOpacity 
              style={[styles.modeButton, styles.truthButton, gameMode === 'truth' && styles.modeButtonActive]}
              onPress={() => setMode('truth')}
            >
              <Text style={styles.modeButtonText}>🔮 TRUTH ONLY</Text>
              <Text style={styles.modeDescription}>Reality-questioning truths</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modeButton, styles.dareButton, gameMode === 'dare' && styles.modeButtonActive]}
              onPress={() => setMode('dare')}
            >
              <Text style={styles.modeButtonText}>💫 DARE ONLY</Text>
              <Text style={styles.modeDescription}>Cosmic action dares</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modeButton, styles.voidButton, gameMode === 'voidChoice' && styles.modeButtonActive]}
              onPress={() => setMode('voidChoice')}
            >
              <Text style={styles.modeButtonText}>🌀 VOID'S CHOICE</Text>
              <Text style={styles.modeDescription}>Mixed + chaos cards!</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity style={styles.startButton} onPress={() => drawCard()}>
            <Text style={styles.startButtonText}>
              {gameMode === 'voidChoice' ? '🌀 DRAW CARD' : 
               gameMode === 'truth' ? '🔮 DRAW TRUTH' : '💫 DRAW DARE'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const cardColor = currentCard ? getCardColor(currentCard.type) : '#8a2be2';
  const cardGradient = currentCard ? getCardGradient(currentCard.type) : ['#000000', '#8a2be2', '#4b0082'];

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { 
        opacity: pulseOpacity,
        transform: [{ scale: pulseScale }]
      }]}>
        <LinearGradient colors={cardGradient as [string, string, string]} style={StyleSheet.absoluteFillObject} />
      </Animated.View>

      <Animated.View style={[
        StyleSheet.absoluteFillObject,
        { 
          backgroundColor: cardColor,
          opacity: glitchAnim,
          transform: [{ translateX: glitchTranslateX }]
        }
      ]} />

      <View style={styles.header}>
        <TouchableOpacity onPress={resetGame} style={styles.backButton}>
          <Text style={styles.backText}>🔄 NEW CARD</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{currentCard?.type.toUpperCase() || 'VOID CARD'}</Text>
        <View style={[styles.chaosBadge, { backgroundColor: cardColor }]}>
          <Text style={styles.chaosBadgeText}>CHAOS {currentCard ? currentCard.chaosLevel + chaosBoost : 0}</Text>
        </View>
      </View>

      {/* Card Container */}
      <View style={styles.cardContainer}>
        <TouchableOpacity onPress={flipCard} activeOpacity={0.9} style={styles.cardTouchable}>
          
          {/* Card Back */}
          <Animated.View style={[
            styles.card,
            styles.cardBack,
            { 
              borderColor: cardColor,
              opacity: backOpacity,
              transform: [
                { scale: backScale },
                { scale: pulseScale }
              ]
            }
          ]}>
            <LinearGradient colors={['#000000', '#8a2be2', '#4b0082']} style={styles.cardContent}>
              <Text style={styles.cardBackText}>🎪</Text>
              <Text style={styles.cardBackTitle}>VOID CARD</Text>
              <Text style={styles.cardBackSubtitle}>Tap to reveal your fate</Text>
              <Text style={styles.tapHint}>↓ Tap anywhere on card ↓</Text>
            </LinearGradient>
          </Animated.View>

          {/* Card Front */}
          <Animated.View style={[
            styles.card,
            styles.cardFront,
            { 
              borderColor: cardColor,
              opacity: frontOpacity,
              transform: [
                { scale: frontScale },
                { scale: pulseScale }
              ]
            }
          ]}>
            <LinearGradient colors={cardGradient as [string, string, string]} style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardType, { color: cardColor }]}>
                  {currentCard?.type === 'truth' ? '🔮 TRUTH' :
                   currentCard?.type === 'dare' ? '💫 DARE' : '🌀 CHAOS CARD'}
                </Text>
                <Text style={styles.cardCategory}>{currentCard?.category.toUpperCase()}</Text>
              </View>

              <Text style={styles.cardText}>{currentCard?.text}</Text>

              <View style={styles.cardFooter}>
                <Text style={styles.chaosLevel}>
                  CHAOS LEVEL: {currentCard ? currentCard.chaosLevel + chaosBoost : 0}/5
                </Text>
                {chaosBoost > 0 && <Text style={styles.chaosBoost}>+{chaosBoost} VOID BOOST! 🔥</Text>}
              </View>
            </LinearGradient>
          </Animated.View>
          
        </TouchableOpacity>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: 'rgba(0, 255, 255, 0.3)' }]} onPress={() => drawCard('truth')}>
          <Text style={styles.actionButtonText}>🔮 TRUTH</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: 'rgba(255, 0, 255, 0.3)' }]} onPress={() => drawCard('dare')}>
          <Text style={styles.actionButtonText}>💫 DARE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: 'rgba(255, 255, 0, 0.3)' }]} onPress={() => drawCard()}>
          <Text style={styles.actionButtonText}>🌀 VOID'S CHOICE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.drinkReminder}>
        <Text style={styles.drinkReminderText}>
          {currentCard?.type === 'truth' ? '🔮 Answer truthfully or drink! 🍻' :
           currentCard?.type === 'dare' ? '💫 Complete the dare or drink! 🍻' :
           '🌀 The void demands participation! 🍻'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
  },
  backButton: { padding: 10 },
  backText: { color: '#00ffff', fontSize: 14, fontWeight: 'bold' },
  title: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1, textAlign: 'center' },
  chaosBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, minWidth: 80, alignItems: 'center' },
  chaosBadgeText: { color: '#000000', fontSize: 12, fontWeight: 'bold' },
  setupContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  setupTitle: { 
    color: '#00ffff', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20,
    textShadowColor: '#ff00ff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10,
  },
  setupDescription: { color: 'rgba(255,255,255,0.8)', fontSize: 16, textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  
  instructionsOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'center', 
    alignItems: 'center', zIndex: 1000, padding: 30,
  },
  instructionsModal: {
    backgroundColor: 'rgba(138, 43, 226, 0.95)', padding: 30, borderRadius: 20, borderWidth: 3,
    borderColor: '#ff00ff', alignItems: 'center', width: '100%',
  },
  instructionsModalTitle: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  instructionsModalText: { color: '#ffffff', fontSize: 16, lineHeight: 24, marginBottom: 30, textAlign: 'center' },
  instructionsButton: {
    backgroundColor: 'rgba(255, 0, 255, 0.3)', paddingHorizontal: 30, paddingVertical: 15,
    borderRadius: 25, borderWidth: 2, borderColor: '#ff00ff',
  },
  instructionsButtonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  
  modeContainer: { width: '100%', marginBottom: 40 },
  modeButton: {
    padding: 25, borderRadius: 20, marginBottom: 15, alignItems: 'center', borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modeButtonActive: { borderWidth: 3 },
  truthButton: { borderColor: '#00ffff' },
  dareButton: { borderColor: '#ff00ff' },
  voidButton: { borderColor: '#ffff00' },
  modeButtonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  modeDescription: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center' },
  
  startButton: {
    backgroundColor: 'rgba(255, 0, 255, 0.3)', paddingHorizontal: 40, paddingVertical: 20,
    borderRadius: 25, borderWidth: 3, borderColor: '#ff00ff', marginBottom: 30,
  },
  startButtonText: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
  
  cardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  cardTouchable: { width: '100%', alignItems: 'center' },
  card: {
    width: '90%', height: 300, borderRadius: 25, borderWidth: 4, backgroundColor: '#000000',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.8,
    shadowRadius: 20, elevation: 10, position: 'absolute',
  },
  cardBack: {
    // Back card styles
  },
  cardFront: {
    // Front card styles  
  },
  cardContent: { flex: 1, borderRadius: 20, padding: 25, justifyContent: 'space-between' },
  
  cardBackText: { fontSize: 60, textAlign: 'center', marginBottom: 10 },
  cardBackTitle: { 
    color: '#ffffff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2,
  },
  cardBackSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 16, textAlign: 'center', marginBottom: 10 },
  tapHint: { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', fontStyle: 'italic' },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardType: { fontSize: 18, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  cardCategory: {
    color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  cardText: {
    color: '#ffffff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', lineHeight: 28, flex: 1,
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3,
    marginVertical: 20,
  },
  cardFooter: { alignItems: 'center' },
  chaosLevel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 'bold' },
  chaosBoost: { color: '#ffff00', fontSize: 12, fontWeight: 'bold', marginTop: 5 },
  
  actionContainer: {
    flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, paddingBottom: 40,
  },
  actionButton: {
    paddingHorizontal: 20, paddingVertical: 15, borderRadius: 20, borderWidth: 2,
    minWidth: 100, alignItems: 'center',
  },
  actionButtonText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  
  drinkReminder: {
    padding: 15, backgroundColor: 'rgba(255, 0, 0, 0.2)', marginHorizontal: 20, marginBottom: 20,
    borderRadius: 10, borderWidth: 1, borderColor: '#ff0000',
  },
  drinkReminderText: { color: '#ff0000', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
});