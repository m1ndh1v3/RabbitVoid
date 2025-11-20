import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  Easing, 
  Modal, 
  Alert,
  StatusBar,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface PremiumChessProps {
  onBack: () => void;
}

type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
type PieceColor = 'white' | 'black';
type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';
type BoardTheme = 'marble' | 'wood' | 'glass' | 'neon' | 'royal' | 'classic';
type Difficulty = 'beginner' | 'intermediate' | 'expert' | 'master';

interface Piece {
  type: PieceType;
  color: PieceColor;
  id: string;
  hasMoved?: boolean;
  value: number;
}

interface Position {
  row: number;
  col: number;
}

interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece | null;
  promotion?: PieceType;
  timestamp: number;
  notation: string;
}

interface GameStats {
  whiteCaptures: Piece[];
  blackCaptures: Piece[];
  moves: number;
  time: number;
}

interface GameHistory {
  id: string;
  moves: Move[];
  result: string;
  date: Date;
  whiteTime: number;
  blackTime: number;
}

export default function PremiumChess({ onBack }: PremiumChessProps) {
  const [board, setBoard] = useState<(Piece | null)[][]>([]);
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white');
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<{position: Position, piece: Piece} | null>(null);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('classic');
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [gameStats, setGameStats] = useState<GameStats>({
    whiteCaptures: [],
    blackCaptures: [],
    moves: 0,
    time: 0
  });
  const [showMoveHistory, setShowMoveHistory] = useState(false);
  const [evaluation, setEvaluation] = useState<number>(0);
  const [hintMove, setHintMove] = useState<{from: Position, to: Position} | null>(null);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [gameResult, setGameResult] = useState<string>('');
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [currentGameMoves, setCurrentGameMoves] = useState<Move[]>([]);
  const [checkingPieces, setCheckingPieces] = useState<Position[]>([]);

  // Animations
  const boardScale = useRef(new Animated.Value(1)).current;
  const pieceScale = useRef(new Animated.Value(1)).current;
  const checkPulse = useRef(new Animated.Value(0)).current;
  const victoryAnim = useRef(new Animated.Value(0)).current;

  // Timer
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize the board
  useEffect(() => {
    initializeBoard();
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (board.length > 0 && currentPlayer) {
      updateEvaluation();
      checkGameState();
    }
  }, [board, currentPlayer]);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      if (gameStatus === 'playing') {
        if (currentPlayer === 'white') {
          setWhiteTime(time => Math.max(0, time - 1));
        } else {
          setBlackTime(time => Math.max(0, time - 1));
        }
      }
    }, 1000);
  };

  const initializeBoard = () => {
    const newBoard: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Set up pawns
    for (let col = 0; col < 8; col++) {
      newBoard[1][col] = { 
        type: 'pawn', 
        color: 'black', 
        id: `black-pawn-${col}`, 
        hasMoved: false,
        value: 1
      };
      newBoard[6][col] = { 
        type: 'pawn', 
        color: 'white', 
        id: `white-pawn-${col}`, 
        hasMoved: false,
        value: 1
      };
    }

    // Set up other pieces with values
    const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    const pieceValues = { rook: 5, knight: 3, bishop: 3, queen: 9, king: 0, pawn: 1 };
    
    for (let col = 0; col < 8; col++) {
      newBoard[0][col] = { 
        type: backRow[col], 
        color: 'black', 
        id: `black-${backRow[col]}-${col}`, 
        hasMoved: false,
        value: pieceValues[backRow[col]]
      };
      newBoard[7][col] = { 
        type: backRow[col], 
        color: 'white', 
        id: `white-${backRow[col]}-${col}`, 
        hasMoved: false,
        value: pieceValues[backRow[col]]
      };
    }

    setBoard(newBoard);
    setGameStatus('playing');
    setCurrentPlayer('white');
    setGameStats({
      whiteCaptures: [],
      blackCaptures: [],
      moves: 0,
      time: 0
    });
    setWhiteTime(600);
    setBlackTime(600);
    setSelectedPiece(null);
    setValidMoves([]);
    setLastMove(null);
    setHintMove(null);
    setShowGameOverModal(false);
    setCurrentGameMoves([]);
    setCheckingPieces([]);
    startTimer();
  };

  // FIXED: Proper checkmate and move validation logic
  const getValidMoves = (position: Position): Position[] => {
    const { row, col } = position;
    const piece = board[row]?.[col];
    if (!piece || piece.color !== currentPlayer) return [];

    let moves: Position[] = [];

    // Get all possible moves for this piece
    switch (piece.type) {
      case 'pawn':
        moves = getPawnMoves(position, piece);
        break;
      case 'rook':
        moves = getRookMoves(position, piece);
        break;
      case 'knight':
        moves = getKnightMoves(position, piece);
        break;
      case 'bishop':
        moves = getBishopMoves(position, piece);
        break;
      case 'queen':
        moves = getQueenMoves(position, piece);
        break;
      case 'king':
        moves = getKingMoves(position, piece);
        break;
    }

    // Filter out moves that would leave or put king in check
    return moves.filter(move => {
      const tempBoard = simulateMove(board, position, move);
      return !isKingInCheck(tempBoard, piece.color).inCheck;
    });
  };

  const isKingInCheck = (boardState: (Piece | null)[][], color: PieceColor): { inCheck: boolean, checkingPieces: Position[] } => {
    const kingPosition = findKingPosition(boardState, color);
    if (!kingPosition) return { inCheck: false, checkingPieces: [] };

    const attackerColor = color === 'white' ? 'black' : 'white';
    const checkingPieces: Position[] = [];

    // Check all opponent pieces to see if they attack the king
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = boardState[row]?.[col];
        if (piece && piece.color === attackerColor) {
          if (canPieceAttackSquare(boardState, { row, col }, kingPosition, piece)) {
            checkingPieces.push({ row, col });
          }
        }
      }
    }

    return { inCheck: checkingPieces.length > 0, checkingPieces };
  };

  const canPieceAttackSquare = (boardState: (Piece | null)[][], from: Position, to: Position, piece: Piece): boolean => {
    const { row, col } = from;
    
    switch (piece.type) {
      case 'pawn':
        const direction = piece.color === 'white' ? -1 : 1;
        // Pawns attack diagonally
        return (to.row === row + direction) && 
               (to.col === col - 1 || to.col === col + 1);
      
      case 'knight':
        const knightMoves = [
          { row: row - 2, col: col - 1 }, { row: row - 2, col: col + 1 },
          { row: row - 1, col: col - 2 }, { row: row - 1, col: col + 2 },
          { row: row + 1, col: col - 2 }, { row: row + 1, col: col + 2 },
          { row: row + 2, col: col - 1 }, { row: row + 2, col: col + 1 },
        ];
        return knightMoves.some(move => 
          move.row === to.row && move.col === to.col
        );
      
      case 'king':
        return Math.abs(to.row - row) <= 1 && Math.abs(to.col - col) <= 1;
      
      case 'rook':
      case 'bishop':
      case 'queen':
        return canSlidingPieceAttack(boardState, from, to, piece);
      
      default:
        return false;
    }
  };

  const canSlidingPieceAttack = (boardState: (Piece | null)[][], from: Position, to: Position, piece: Piece): boolean => {
    const { row, col } = from;
    const dRow = to.row - row;
    const dCol = to.col - col;
    
    // Check if it's a valid direction for the piece
    if (piece.type === 'rook' && dRow !== 0 && dCol !== 0) return false;
    if (piece.type === 'bishop' && Math.abs(dRow) !== Math.abs(dCol)) return false;
    if (piece.type === 'queen' && dRow !== 0 && dCol !== 0 && Math.abs(dRow) !== Math.abs(dCol)) return false;
    
    const stepRow = dRow === 0 ? 0 : dRow > 0 ? 1 : -1;
    const stepCol = dCol === 0 ? 0 : dCol > 0 ? 1 : -1;
    
    let currentRow = row + stepRow;
    let currentCol = col + stepCol;
    
    // Check all squares along the path
    while (currentRow !== to.row || currentCol !== to.col) {
      if (boardState[currentRow]?.[currentCol]) {
        return false; // Piece in the way
      }
      currentRow += stepRow;
      currentCol += stepCol;
    }
    
    return true;
  };

  const findKingPosition = (boardState: (Piece | null)[][], color: PieceColor): Position | null => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = boardState[row]?.[col];
        if (piece && piece.type === 'king' && piece.color === color) {
          return { row, col };
        }
      }
    }
    return null;
  };

  const getPawnMoves = (position: Position, piece: Piece): Position[] => {
    const { row, col } = position;
    const moves: Position[] = [];
    const direction = piece.color === 'white' ? -1 : 1;
    const startRow = piece.color === 'white' ? 6 : 1;

    // Forward move
    if (isValidPosition(row + direction, col) && !board[row + direction]?.[col]) {
      moves.push({ row: row + direction, col });
      
      // Double move from starting position
      if (row === startRow && !board[row + 2 * direction]?.[col]) {
        moves.push({ row: row + 2 * direction, col });
      }
    }

    // Captures
    [-1, 1].forEach(dc => {
      const newRow = row + direction;
      const newCol = col + dc;
      
      if (isValidPosition(newRow, newCol)) {
        const targetPiece = board[newRow]?.[newCol];
        if (targetPiece && targetPiece.color !== piece.color) {
          moves.push({ row: newRow, col: newCol });
        }
        // En passant (simplified)
        else if (!targetPiece && lastMove?.piece.type === 'pawn' && 
                 Math.abs(lastMove.from.row - lastMove.to.row) === 2 &&
                 lastMove.to.row === row &&
                 lastMove.to.col === newCol) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    });

    return moves;
  };

  const getSlidingMoves = (position: Position, piece: Piece, directions: {dr: number, dc: number}[]): Position[] => {
    const moves: Position[] = [];
    const { row, col } = position;

    directions.forEach(({ dr, dc }) => {
      for (let i = 1; i < 8; i++) {
        const newRow = row + dr * i;
        const newCol = col + dc * i;
        
        if (!isValidPosition(newRow, newCol)) break;
        
        const targetPiece = board[newRow]?.[newCol];
        if (!targetPiece) {
          moves.push({ row: newRow, col: newCol });
        } else {
          if (targetPiece.color !== piece.color) {
            moves.push({ row: newRow, col: newCol });
          }
          break;
        }
      }
    });

    return moves;
  };

  const getRookMoves = (position: Position, piece: Piece): Position[] => {
    return getSlidingMoves(position, piece, [
      { dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }
    ]);
  };

  const getBishopMoves = (position: Position, piece: Piece): Position[] => {
    return getSlidingMoves(position, piece, [
      { dr: -1, dc: -1 }, { dr: -1, dc: 1 }, { dr: 1, dc: -1 }, { dr: 1, dc: 1 }
    ]);
  };

  const getQueenMoves = (position: Position, piece: Piece): Position[] => {
    return getSlidingMoves(position, piece, [
      { dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
      { dr: -1, dc: -1 }, { dr: -1, dc: 1 }, { dr: 1, dc: -1 }, { dr: 1, dc: 1 }
    ]);
  };

  const getKnightMoves = (position: Position, piece: Piece): Position[] => {
    const { row, col } = position;
    const moves: Position[] = [];
    const knightMoves = [
      { row: row - 2, col: col - 1 }, { row: row - 2, col: col + 1 },
      { row: row - 1, col: col - 2 }, { row: row - 1, col: col + 2 },
      { row: row + 1, col: col - 2 }, { row: row + 1, col: col + 2 },
      { row: row + 2, col: col - 1 }, { row: row + 2, col: col + 1 },
    ];

    knightMoves.forEach(move => {
      if (isValidPosition(move.row, move.col)) {
        const targetPiece = board[move.row]?.[move.col];
        if (!targetPiece || targetPiece.color !== piece.color) {
          moves.push(move);
        }
      }
    });

    return moves;
  };

  const getKingMoves = (position: Position, piece: Piece): Position[] => {
    const { row, col } = position;
    const moves: Position[] = [];
    const kingMoves = [
      { row: row - 1, col: col - 1 }, { row: row - 1, col: col }, { row: row - 1, col: col + 1 },
      { row: row, col: col - 1 }, { row: row, col: col + 1 },
      { row: row + 1, col: col - 1 }, { row: row + 1, col: col }, { row: row + 1, col: col + 1 },
    ];

    kingMoves.forEach(move => {
      if (isValidPosition(move.row, move.col)) {
        const targetPiece = board[move.row]?.[move.col];
        if (!targetPiece || targetPiece.color !== piece.color) {
          // Check if the move would put king in check
          const tempBoard = simulateMove(board, position, move);
          if (!isKingInCheck(tempBoard, piece.color).inCheck) {
            moves.push(move);
          }
        }
      }
    });

    // Castling
    if (!piece.hasMoved && !isKingInCheck(board, piece.color).inCheck) {
      // Kingside
      if (canCastleKingside(piece.color)) {
        moves.push({ row, col: col + 2 });
      }
      // Queenside
      if (canCastleQueenside(piece.color)) {
        moves.push({ row, col: col - 2 });
      }
    }

    return moves;
  };

  const canCastleKingside = (color: PieceColor): boolean => {
    const row = color === 'white' ? 7 : 0;
    const king = board[row]?.[4];
    const rook = board[row]?.[7];
    
    return !!(king && rook && !king.hasMoved && !rook.hasMoved &&
      !board[row]?.[5] && !board[row]?.[6] &&
      !isSquareAttacked({ row, col: 4 }, color) &&
      !isSquareAttacked({ row, col: 5 }, color) &&
      !isSquareAttacked({ row, col: 6 }, color));
  };

  const canCastleQueenside = (color: PieceColor): boolean => {
    const row = color === 'white' ? 7 : 0;
    const king = board[row]?.[4];
    const rook = board[row]?.[0];
    
    return !!(king && rook && !king.hasMoved && !rook.hasMoved &&
      !board[row]?.[1] && !board[row]?.[2] && !board[row]?.[3] &&
      !isSquareAttacked({ row, col: 4 }, color) &&
      !isSquareAttacked({ row, col: 3 }, color) &&
      !isSquareAttacked({ row, col: 2 }, color));
  };

  const isSquareAttacked = (position: Position, defenderColor: PieceColor): boolean => {
    const attackerColor = defenderColor === 'white' ? 'black' : 'white';
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row]?.[col];
        if (piece && piece.color === attackerColor) {
          if (canPieceAttackSquare(board, { row, col }, position, piece)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const simulateMove = (boardState: (Piece | null)[][], from: Position, to: Position): (Piece | null)[][] => {
    const newBoard = boardState.map(row => row ? [...row] : []);
    const piece = newBoard[from.row]?.[from.col];
    
    if (piece) {
      if (!newBoard[to.row]) newBoard[to.row] = [];
      newBoard[to.row][to.col] = { ...piece, hasMoved: true };
      newBoard[from.row][from.col] = null;
    }
    
    return newBoard;
  };

  const isValidPosition = (row: number, col: number): boolean => {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  };

  // FIXED: Proper checkmate detection
  const checkGameState = () => {
    if (gameStatus === 'checkmate' || gameStatus === 'stalemate') return;

    const checkState = isKingInCheck(board, currentPlayer);
    const inCheck = checkState.inCheck;
    
    if (inCheck) {
      setGameStatus('check');
      setCheckingPieces(checkState.checkingPieces);
      
      Animated.sequence([
        Animated.timing(checkPulse, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(checkPulse, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      setGameStatus('playing');
      setCheckingPieces([]);
    }

    // Check if current player has any valid moves
    const hasValidMoves = hasAnyValidMoves(currentPlayer);
    
    if (inCheck && !hasValidMoves) {
      // CHECKMATE
      setGameStatus('checkmate');
      const winner = currentPlayer === 'white' ? 'Black' : 'White';
      setGameResult(`${winner} wins by Checkmate`);
      saveGameToHistory(`${winner} wins`);
      setShowGameOverModal(true);
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } else if (!inCheck && !hasValidMoves) {
      // STALEMATE
      setGameStatus('stalemate');
      setGameResult('Draw by Stalemate');
      saveGameToHistory('Draw');
      setShowGameOverModal(true);
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // FIXED: Proper check for any valid moves
  const hasAnyValidMoves = (color: PieceColor): boolean => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row]?.[col];
        if (piece && piece.color === color) {
          const moves = getValidMoves({ row, col });
          if (moves.length > 0) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const handleSquarePress = (row: number, col: number) => {
    if (gameStatus === 'checkmate' || gameStatus === 'stalemate') return;
    
    const piece = board[row]?.[col];

    if (piece && piece.color === currentPlayer) {
      setSelectedPiece({ row, col });
      const moves = getValidMoves({ row, col });
      setValidMoves(moves);
      
      Animated.sequence([
        Animated.timing(pieceScale, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pieceScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
    else if (selectedPiece && validMoves.some(move => move.row === row && move.col === col)) {
      const from = selectedPiece;
      const pieceToMove = board[from.row]?.[from.col];
      if (!pieceToMove) return;
      
      if (pieceToMove.type === 'pawn' && (row === 0 || row === 7)) {
        setPendingPromotion({ position: { row, col }, piece: pieceToMove });
        setShowPromotionModal(true);
      } else {
        makeMove(from, { row, col });
      }
    }
    else {
      setSelectedPiece(null);
      setValidMoves([]);
    }
  };

  const makeMove = (from: Position, to: Position, promotionType?: PieceType) => {
    const newBoard = [...board.map(row => row ? [...row] : [])];
    const piece = newBoard[from.row]?.[from.col];
    if (!piece) return;

    const captured = newBoard[to.row]?.[to.col];

    // Update capture stats
    if (captured) {
      setGameStats(prev => ({
        ...prev,
        [piece.color === 'white' ? 'whiteCaptures' : 'blackCaptures']: [
          ...prev[piece.color === 'white' ? 'whiteCaptures' : 'blackCaptures'],
          captured
        ]
      }));
    }

    let movedPiece = { ...piece, hasMoved: true };
    if (promotionType) {
      movedPiece = { ...movedPiece, type: promotionType, value: promotionType === 'queen' ? 9 : promotionType === 'rook' ? 5 : promotionType === 'bishop' || promotionType === 'knight' ? 3 : 1 };
    }

    newBoard[to.row][to.col] = movedPiece;
    newBoard[from.row][from.col] = null;

    const move: Move = { 
      from, 
      to, 
      piece: movedPiece, 
      captured, 
      promotion: promotionType,
      timestamp: Date.now(),
      notation: getMoveNotation(from, to, piece, promotionType, captured)
    };
    
    setCurrentGameMoves(prev => [...prev, move]);
    setGameStats(prev => ({ ...prev, moves: prev.moves + 1 }));
    setBoard(newBoard);
    setSelectedPiece(null);
    setValidMoves([]);
    setLastMove(move);
    setHintMove(null);
    setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
  };

  const getMoveNotation = (from: Position, to: Position, piece: Piece, promotion?: PieceType, captured?: Piece | null): string => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const pieceSymbol = piece.type === 'pawn' ? '' : piece.type === 'knight' ? 'N' : piece.type[0].toUpperCase();
    const capture = captured ? 'x' : '';
    const promotionText = promotion ? `=${promotion[0].toUpperCase()}` : '';
    
    return `${pieceSymbol}${files[from.col]}${8 - from.row}${capture}${files[to.col]}${8 - to.row}${promotionText}`;
  };

  const handlePromotion = (promotionType: PieceType) => {
    if (pendingPromotion && selectedPiece) {
      makeMove(selectedPiece, pendingPromotion.position, promotionType);
      setShowPromotionModal(false);
      setPendingPromotion(null);
    }
  };

  const saveGameToHistory = (result: string) => {
    const gameRecord: GameHistory = {
      id: Date.now().toString(),
      moves: [...currentGameMoves],
      result,
      date: new Date(),
      whiteTime,
      blackTime
    };
    setGameHistory(prev => [gameRecord, ...prev.slice(0, 9)]);
  };

  const updateEvaluation = () => {
    let whiteScore = 0;
    let blackScore = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row]?.[col];
        if (piece) {
          if (piece.color === 'white') {
            whiteScore += piece.value;
          } else {
            blackScore += piece.value;
          }
        }
      }
    }

    const positionBonus = evaluatePosition(board);
    whiteScore += positionBonus.white;
    blackScore += positionBonus.black;

    setEvaluation(whiteScore - blackScore);
  };

  const evaluatePosition = (boardState: (Piece | null)[][]) => {
    let whiteBonus = 0;
    let blackBonus = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = boardState[row]?.[col];
        if (piece) {
          const centerControl = Math.max(3 - Math.abs(row - 3.5), 3 - Math.abs(col - 3.5));
          if (piece.color === 'white') {
            whiteBonus += centerControl * 0.1;
          } else {
            blackBonus += centerControl * 0.1;
          }
        }
      }
    }

    return { white: whiteBonus, black: blackBonus };
  };

  const getBestMove = (): {from: Position, to: Position} | null => {
    const moves: {from: Position, to: Position, score: number}[] = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row]?.[col];
        if (piece && piece.color === currentPlayer) {
          const validMoves = getValidMoves({ row, col });
          validMoves.forEach(move => {
            const tempBoard = simulateMove(board, { row, col }, move);
            const captured = board[move.row]?.[move.col];
            let score = captured ? captured.value * 10 : 0;
            
            const centerBonus = Math.max(3 - Math.abs(move.row - 3.5), 3 - Math.abs(move.col - 3.5));
            score += centerBonus;
            
            moves.push({ from: { row, col }, to: move, score });
          });
        }
      }
    }
    
    if (moves.length === 0) return null;
    
    moves.sort((a, b) => b.score - a.score);
    const difficultyWeights = { beginner: 0.3, intermediate: 0.6, expert: 0.8, master: 0.95 };
    const weight = difficultyWeights[difficulty];
    const bestMoveIndex = Math.floor(Math.pow(Math.random(), weight) * moves.length);
    
    return moves[bestMoveIndex] || null;
  };

  const showHint = () => {
    const bestMove = getBestMove();
    if (bestMove) {
      setHintMove(bestMove);
      setTimeout(() => setHintMove(null), 3000);
    }
  };

  const getPieceSymbol = (piece: Piece): string => {
    const symbols = {
      white: { pawn: '♙', rook: '♖', knight: '♘', bishop: '♗', queen: '♕', king: '♔' },
      black: { pawn: '♟', rook: '♜', knight: '♞', bishop: '♝', queen: '♛', king: '♚' }
    };
    return symbols[piece.color][piece.type];
  };

  const getPieceColor = (piece: Piece): string => {
    if (boardTheme === 'neon') {
      return piece.color === 'white' ? '#00ffff' : '#ff00ff';
    } else if (boardTheme === 'glass') {
      return piece.color === 'white' ? '#ffffff' : '#000000';
    } else {
      return piece.color === 'white' ? '#ffffff' : '#000000';
    }
  };

  const getPieceShadow = (piece: Piece): object => {
    if (piece.color === 'white') {
      return {
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
      };
    } else {
      return {
        textShadowColor: 'rgba(255,255,255,0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
      };
    }
  };

  const getSquareColor = (row: number, col: number): string => {
    const isLight = (row + col) % 2 === 0;
    
    switch (boardTheme) {
      case 'wood':
        return isLight ? '#f0d9b5' : '#b58863';
      case 'glass':
        return isLight ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.4)';
      case 'neon':
        return isLight ? '#1a1a2e' : '#16213e';
      case 'royal':
        return isLight ? '#d4af37' : '#b8860b';
      case 'marble':
        return isLight ? '#e8e8e8' : '#a8a8a8';
      case 'classic':
      default:
        return isLight ? '#f0d9b5' : '#b58863';
    }
  };

  const getSquareBorderColor = (row: number, col: number): string => {
    switch (boardTheme) {
      case 'wood':
        return '#8b4513';
      case 'glass':
        return 'rgba(255,255,255,0.3)';
      case 'neon':
        return '#00ffff';
      case 'royal':
        return '#ffd700';
      case 'marble':
        return '#666666';
      case 'classic':
      default:
        return '#8b4513';
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const victoryScale = victoryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05]
  });

  const checkBackground = checkPulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,0,0,0)', 'rgba(255,0,0,0.3)']
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: checkBackground }]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.title}>GRAND MASTER CHESS</Text>
          <Text style={styles.subtitle}>Professional Edition</Text>
        </View>

        <TouchableOpacity onPress={() => setShowMoveHistory(!showMoveHistory)} style={styles.historyButton}>
          <Text style={styles.historyText}>📋</Text>
        </TouchableOpacity>
      </View>

      {/* Game Info */}
      <View style={styles.gameInfo}>
        <View style={styles.playerInfo}>
          <View style={[styles.playerCard, currentPlayer === 'white' && styles.activePlayer]}>
            <Text style={styles.playerName}>WHITE</Text>
            <Text style={styles.playerTime}>{formatTime(whiteTime)}</Text>
            <Text style={styles.playerMaterial}>+{gameStats.whiteCaptures.reduce((sum, piece) => sum + piece.value, 0)}</Text>
          </View>
          
          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
            <Text style={styles.movesText}>{gameStats.moves} moves</Text>
            <Text style={styles.gameStatusText}>
              {gameStatus === 'check' && '⚡ CHECK!'}
              {gameStatus === 'checkmate' && '💀 CHECKMATE!'}
              {gameStatus === 'stalemate' && '🤝 STALEMATE!'}
            </Text>
          </View>

          <View style={[styles.playerCard, currentPlayer === 'black' && styles.activePlayer]}>
            <Text style={styles.playerName}>BLACK</Text>
            <Text style={styles.playerTime}>{formatTime(blackTime)}</Text>
            <Text style={styles.playerMaterial}>+{gameStats.blackCaptures.reduce((sum, piece) => sum + piece.value, 0)}</Text>
          </View>
        </View>

        <View style={styles.evaluationBar}>
          <View 
            style={[
              styles.evaluationFill,
              { 
                width: `${50 + (evaluation / 40) * 50}%`,
                backgroundColor: evaluation >= 0 ? '#2e8b57' : '#dc143c'
              }
            ]} 
          />
          <Text style={styles.evaluationText}>
            {evaluation > 0 ? '+' : ''}{evaluation.toFixed(1)}
          </Text>
        </View>
      </View>

      {/* Chess Board */}
      <Animated.View style={[styles.boardContainer, { transform: [{ scale: victoryScale }] }]}>
        <View style={[styles.board, { borderColor: getSquareBorderColor(0, 0) }]}>
          {board.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((piece, colIndex) => {
                const isSelected = selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex;
                const isValidMove = validMoves.some(move => move.row === rowIndex && move.col === colIndex);
                const isLastMove = lastMove ? (lastMove.from.row === rowIndex && lastMove.from.col === colIndex) || 
                  (lastMove.to.row === rowIndex && lastMove.to.col === colIndex) : false;
                const isHintMove = hintMove ? (hintMove.from.row === rowIndex && hintMove.from.col === colIndex) || 
                  (hintMove.to.row === rowIndex && hintMove.to.col === colIndex) : false;
                const isCheckingPiece = checkingPieces.some(pos => pos.row === rowIndex && pos.col === colIndex);
                const isKingInCheck = piece?.type === 'king' && piece.color === currentPlayer && gameStatus === 'check';
                
                return (
                  <TouchableOpacity
                    key={`${rowIndex}-${colIndex}`}
                    style={[
                      styles.square,
                      { 
                        backgroundColor: getSquareColor(rowIndex, colIndex),
                        borderColor: getSquareBorderColor(rowIndex, colIndex)
                      },
                      isSelected && styles.selectedSquare,
                      isLastMove && styles.lastMoveSquare,
                      isHintMove && styles.hintSquare,
                      isCheckingPiece && styles.checkingPieceSquare,
                      isKingInCheck && styles.kingInCheckSquare,
                    ]}
                    onPress={() => handleSquarePress(rowIndex, colIndex)}
                  >
                    {piece && (
                      <Animated.Text style={[
                        styles.piece,
                        isSelected && { transform: [{ scale: pieceScale }] },
                        { color: getPieceColor(piece) },
                        getPieceShadow(piece)
                      ]}>
                        {getPieceSymbol(piece)}
                      </Animated.Text>
                    )}
                    {isValidMove && (
                      <View style={[
                        styles.moveIndicator,
                        board[rowIndex]?.[colIndex] ? styles.captureIndicator : styles.moveIndicator
                      ]} />
                    )}
                    {(rowIndex === 7 || colIndex === 0) && (
                      <Text style={styles.coordinate}>
                        {colIndex === 0 ? 8 - rowIndex : ''}
                        {rowIndex === 7 ? String.fromCharCode(97 + colIndex) : ''}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={initializeBoard}>
          <Text style={styles.controlButtonText}>🔄 New</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={showHint}>
          <Text style={styles.controlButtonText}>💡 Hint</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={() => {
          const themes: BoardTheme[] = ['classic', 'marble', 'wood', 'glass', 'neon', 'royal'];
          setBoardTheme(themes[(themes.indexOf(boardTheme) + 1) % themes.length]);
        }}>
          <Text style={styles.controlButtonText}>🎨 Theme</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={() => {
          const difficulties: Difficulty[] = ['beginner', 'intermediate', 'expert', 'master'];
          setDifficulty(difficulties[(difficulties.indexOf(difficulty) + 1) % difficulties.length]);
        }}>
          <Text style={styles.controlButtonText}>⚙️ {difficulty}</Text>
        </TouchableOpacity>
      </View>

      {/* Game Over Modal */}
      <Modal visible={showGameOverModal} transparent animationType="fade">
        <View style={styles.gameOverModalOverlay}>
          <View style={styles.gameOverModal}>
            <Text style={styles.gameOverTitle}>Game Over</Text>
            <Text style={styles.gameOverResult}>{gameResult}</Text>
            <View style={styles.gameOverStats}>
              <Text style={styles.gameOverStat}>Moves: {gameStats.moves}</Text>
              <Text style={styles.gameOverStat}>White Time: {formatTime(whiteTime)}</Text>
              <Text style={styles.gameOverStat}>Black Time: {formatTime(blackTime)}</Text>
            </View>
            <View style={styles.gameOverButtons}>
              <TouchableOpacity 
                style={[styles.gameOverButton, styles.analyzeButton]}
                onPress={() => setShowGameOverModal(false)}
              >
                <Text style={styles.gameOverButtonText}>Analyze Game</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.gameOverButton, styles.newGameButton]}
                onPress={initializeBoard}
              >
                <Text style={styles.gameOverButtonText}>New Game</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Move History Modal */}
      <Modal visible={showMoveHistory} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.historyModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Game History</Text>
              <TouchableOpacity onPress={() => setShowMoveHistory(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.historyList}>
              {gameHistory.length === 0 ? (
                <Text style={styles.noMovesText}>No games played yet</Text>
              ) : (
                gameHistory.map((game, index) => (
                  <View key={game.id} style={styles.historyItem}>
                    <Text style={styles.historyGameNumber}>Game {gameHistory.length - index}</Text>
                    <Text style={styles.historyResult}>{game.result}</Text>
                    <Text style={styles.historyDate}>
                      {game.date.toLocaleDateString()} - {game.moves.length} moves
                    </Text>
                    <Text style={styles.historyTime}>
                      White: {formatTime(game.whiteTime)} | Black: {formatTime(game.blackTime)}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Promotion Modal */}
      <Modal visible={showPromotionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.promotionModal}>
            <Text style={styles.promotionTitle}>Promote to:</Text>
            <View style={styles.promotionOptions}>
              {['queen', 'rook', 'bishop', 'knight'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={styles.promotionOption}
                  onPress={() => handlePromotion(type as PieceType)}
                >
                  <Text style={[
                    styles.promotionPiece,
                    { color: getPieceColor({ type: type as PieceType, color: pendingPromotion?.piece.color || 'white', id: '', value: 0 }) },
                    getPieceShadow({ type: type as PieceType, color: pendingPromotion?.piece.color || 'white', id: '', value: 0 })
                  ]}>
                    {getPieceSymbol({ 
                      type: type as PieceType, 
                      color: pendingPromotion?.piece.color || 'white', 
                      id: '',
                      value: 0 
                    })}
                  </Text>
                  <Text style={styles.promotionText}>{type.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButton: {
    padding: 10,
  },
  backText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerCenter: {
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  historyButton: {
    padding: 10,
  },
  historyText: {
    color: '#ffffff',
    fontSize: 20,
  },
  gameInfo: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  playerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  playerCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    minWidth: 80,
  },
  activePlayer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: '#00ffff',
  },
  playerName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  playerTime: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerMaterial: {
    color: '#ffff00',
    fontSize: 12,
    marginTop: 2,
  },
  vsContainer: {
    alignItems: 'center',
  },
  vsText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: 'bold',
  },
  movesText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginTop: 2,
  },
  gameStatusText: {
    color: '#ff4444',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  evaluationBar: {
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  evaluationFill: {
    height: '100%',
    borderRadius: 10,
  },
  evaluationText: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -15 }, { translateY: -8 }],
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  board: {
    aspectRatio: 1,
    width: '100%',
    maxWidth: Math.min(width, height) - 40,
    borderWidth: 3,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  square: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    position: 'relative',
  },
  selectedSquare: {
    backgroundColor: 'rgba(52, 152, 219, 0.3)',
  },
  lastMoveSquare: {
    backgroundColor: 'rgba(241, 196, 15, 0.3)',
  },
  hintSquare: {
    borderWidth: 2,
    borderColor: '#00ff00',
  },
  checkingPieceSquare: {
    backgroundColor: 'rgba(255, 68, 68, 0.3)',
    borderWidth: 2,
    borderColor: '#ff4444',
  },
  kingInCheckSquare: {
    backgroundColor: 'rgba(255, 0, 0, 0.4)',
    borderWidth: 2,
    borderColor: '#ff0000',
  },
  piece: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  moveIndicator: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(46, 204, 113, 0.3)',
    borderWidth: 1,
    borderColor: '#2ecc71',
  },
  captureIndicator: {
    width: '80%',
    height: '80%',
    borderRadius: 0,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#e74c3c',
  },
  coordinate: {
    position: 'absolute',
    fontSize: 10,
    color: 'rgba(0,0,0,0.6)',
    fontWeight: 'bold',
    bottom: 2,
    right: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 25,
    paddingTop: 15,
  },
  controlButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    minWidth: 80,
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  gameOverModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 50,
  },
  gameOverModal: {
    backgroundColor: '#2c3e50',
    padding: 25,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3498db',
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
  },
  gameOverTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  gameOverResult: {
    color: '#f39c12',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  gameOverStats: {
    marginBottom: 20,
    alignItems: 'center',
  },
  gameOverStat: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 5,
  },
  gameOverButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  gameOverButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  analyzeButton: {
    backgroundColor: 'rgba(52, 152, 219, 0.3)',
    borderWidth: 1,
    borderColor: '#3498db',
  },
  newGameButton: {
    backgroundColor: 'rgba(46, 204, 113, 0.3)',
    borderWidth: 1,
    borderColor: '#2ecc71',
  },
  gameOverButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyModal: {
    backgroundColor: '#2c3e50',
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalClose: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  historyList: {
    padding: 20,
  },
  historyItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  historyGameNumber: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  historyResult: {
    color: '#f39c12',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  historyDate: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 2,
  },
  historyTime: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  noMovesText: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  promotionModal: {
    backgroundColor: '#34495e',
    padding: 25,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3498db',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  promotionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  promotionOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  promotionOption: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  promotionPiece: {
    fontSize: 28,
    marginBottom: 6,
    fontWeight: 'bold',
  },
  promotionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});