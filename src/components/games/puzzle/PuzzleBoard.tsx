'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PuzzleConfig } from '@/types/games';
import { formatTime } from '@/lib/game-utils';

type PuzzleBoardProps = {
  config: PuzzleConfig;
  onComplete: (timeUsed: number, hintsUsed: number) => void;
  onQuit: () => void;
};

type Piece = {
  id: number;
  currentIndex: number;
  correctIndex: number;
};

// Available luxury property images for puzzle game
const PROPERTY_IMAGES = [
  '/images/properties/luxury-villa-1.svg',
  '/images/properties/luxury-villa-2.svg',
  '/images/properties/luxury-villa-3.svg',
  '/images/properties/luxury-villa-4.svg',
] as const;

export function PuzzleBoard({ config, onComplete, onQuit }: PuzzleBoardProps) {
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const gridSize = Math.sqrt(config.pieces);
  
  // Select a random property image for this puzzle session
  const [propertyImage] = useState(() => {
    return PROPERTY_IMAGES[Math.floor(Math.random() * PROPERTY_IMAGES.length)];
  });

  // Initialize puzzle pieces - use useMemo to avoid recreation
  const [pieces, setPieces] = useState<Piece[]>(() => {
    const initialPieces: Piece[] = Array.from({ length: config.pieces }, (_, i) => ({
      id: i,
      currentIndex: i,
      correctIndex: i,
    }));
    
    // Shuffle pieces
    for (let i = initialPieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = initialPieces[i].currentIndex;
      initialPieces[i].currentIndex = initialPieces[j].currentIndex;
      initialPieces[j].currentIndex = temp;
    }
    
    return initialPieces;
  });

  // Timer
  useEffect(() => {
    if (isComplete || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isComplete, timeLeft]);

  // Check if puzzle is complete - using ref to avoid triggering setState in effect
  const completeCheckRef = useRef(false);
  
  useEffect(() => {
    if (pieces.length === 0 || completeCheckRef.current) return;
    
    const complete = pieces.every(piece => piece.currentIndex === piece.correctIndex);
    if (complete && !isComplete) {
      completeCheckRef.current = true;
      const timeUsed = config.timeLimit - timeLeft;
      // Use setTimeout to schedule state update after effect
      setTimeout(() => {
        setIsComplete(true);
        onComplete(timeUsed, hintsUsed);
      }, 0);
    }
  }, [pieces, config.timeLimit, timeLeft, hintsUsed, isComplete, onComplete]);

  const handlePieceClick = useCallback((index: number) => {
    if (isComplete) return;

    if (selectedPiece === null) {
      setSelectedPiece(index);
    } else {
      // Swap pieces
      setPieces(prev => {
        const newPieces = [...prev];
        const piece1 = newPieces.find(p => p.currentIndex === selectedPiece);
        const piece2 = newPieces.find(p => p.currentIndex === index);
        
        if (piece1 && piece2) {
          const temp = piece1.currentIndex;
          piece1.currentIndex = piece2.currentIndex;
          piece2.currentIndex = temp;
        }
        
        return newPieces;
      });
      setSelectedPiece(null);
    }
  }, [selectedPiece, isComplete]);

  const handleHint = useCallback(() => {
    if (hintsUsed >= 3) return;
    
    // Find a piece that's in the wrong position
    const wrongPiece = pieces.find(p => p.currentIndex !== p.correctIndex);
    if (wrongPiece) {
      // Show hint by moving piece to correct position
      setPieces(prev => {
        const newPieces = [...prev];
        const targetPiece = newPieces.find(p => p.currentIndex === wrongPiece.correctIndex);
        
        if (targetPiece) {
          const temp = wrongPiece.currentIndex;
          wrongPiece.currentIndex = targetPiece.currentIndex;
          targetPiece.currentIndex = temp;
        }
        
        return newPieces;
      });
      setHintsUsed(prev => prev + 1);
    }
  }, [pieces, hintsUsed]);

  if (timeLeft === 0 && !isComplete) {
    return (
      <div className="text-center space-y-6">
        <div className="text-6xl">⏱️</div>
        <h2 className="text-2xl font-bold text-gray-900">Tempo Esgotado!</h2>
        <p className="text-gray-600">Tente novamente ou escolha uma dificuldade diferente.</p>
        <button
          onClick={onQuit}
          className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onQuit}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Voltar
        </button>
        <div className="flex items-center gap-6 text-sm font-semibold">
          <div className="flex items-center gap-2">
            <span>⏱️</span>
            <span className={timeLeft < 30 ? 'text-red-600' : 'text-gray-900'}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>💡</span>
            <span className="text-gray-900">{3 - hintsUsed} dicas</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div
          className="grid gap-1 bg-purple-100 p-2 rounded-2xl"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            maxWidth: '600px',
            width: '100%',
          }}
        >
          {pieces.map((piece) => {
            const row = Math.floor(piece.correctIndex / gridSize);
            const col = piece.correctIndex % gridSize;
            const isCorrect = piece.currentIndex === piece.correctIndex;
            
            return (
              <button
                key={piece.id}
                onClick={() => handlePieceClick(piece.currentIndex)}
                className={`
                  aspect-square rounded-lg transition-all overflow-hidden relative
                  ${selectedPiece === piece.currentIndex ? 'ring-4 ring-purple-500 scale-95' : ''}
                  ${isCorrect ? 'ring-2 ring-green-400' : ''}
                  hover:scale-95 active:scale-90
                  flex items-center justify-center
                `}
                style={{
                  backgroundImage: `url(${propertyImage})`,
                  backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                  backgroundPosition: `${col * 100 / (gridSize - 1)}% ${row * 100 / (gridSize - 1)}%`,
                  backgroundRepeat: 'no-repeat',
                }}
              >
                {/* Number overlay for easy mode only */}
                {config.pieces === 9 && (
                  <span className="absolute inset-0 flex items-center justify-center text-white text-2xl font-bold drop-shadow-lg bg-black/20">
                    {piece.id + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleHint}
          disabled={hintsUsed >= 3}
          className="rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          💡 Usar Dica (-50 pontos)
        </button>
      </div>
    </div>
  );
}
