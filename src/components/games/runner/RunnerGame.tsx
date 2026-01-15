'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MobileGamepad, type GamepadButton } from '../MobileGamepad';

type RunnerGameProps = {
  onGameOver: (score: number, distance: number) => void;
};

type Item = {
  x: number;
  y: number;
  type: 'lead-qualificado' | 'lead-morno' | 'contrato' | 'powerup' | 'obstacle';
  width: number;
  height: number;
};

const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const GROUND_Y = 250;

export function RunnerGame({ onGameOver }: RunnerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPowerUp, setIsPowerUp] = useState(false);
  
  const gameState = useRef({
    player: { x: 50, y: GROUND_Y, velocityY: 0, isJumping: false, width: 40, height: 50 },
    items: [] as Item[],
    speed: 5,
    frameCount: 0,
    powerUpTimer: 0,
  });

  const createItem = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const types: Item['type'][] = ['lead-qualificado', 'lead-morno', 'contrato', 'powerup', 'obstacle'];
    const weights = [40, 30, 5, 10, 15]; // Probability weights
    
    const rand = Math.random() * 100;
    let cumulative = 0;
    let selectedType: Item['type'] = 'lead-qualificado';
    
    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (rand <= cumulative) {
        selectedType = types[i];
        break;
      }
    }

    const item: Item = {
      x: canvas.width,
      y: selectedType === 'obstacle' ? GROUND_Y : Math.random() * 150 + 100,
      type: selectedType,
      width: 30,
      height: 30,
    };

    gameState.current.items.push(item);
  }, []);

  const checkCollision = useCallback((player: typeof gameState.current.player, item: Item) => {
    return (
      player.x < item.x + item.width &&
      player.x + player.width > item.x &&
      player.y < item.y + item.height &&
      player.y + player.height > item.y
    );
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || isGameOver) return;

    const state = gameState.current;

    // Clear canvas
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw ground
    ctx.fillStyle = '#d1d5db';
    ctx.fillRect(0, GROUND_Y + state.player.height, canvas.width, 50);

    // Update player
    if (state.player.isJumping) {
      state.player.velocityY += GRAVITY;
      state.player.y += state.player.velocityY;

      if (state.player.y >= GROUND_Y) {
        state.player.y = GROUND_Y;
        state.player.velocityY = 0;
        state.player.isJumping = false;
      }
    }

    // Draw player (consultant character)
    ctx.fillStyle = isPowerUp ? '#fbbf24' : '#8b5cf6';
    ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height);
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(state.player.x + 10, state.player.y + 10, 20, 20); // Face

    // Update and draw items
    state.items = state.items.filter(item => {
      item.x -= state.speed;

      if (item.x + item.width < 0) return false;

      // Check collision
      if (checkCollision(state.player, item)) {
        if (item.type === 'obstacle') {
          setIsGameOver(true);
          onGameOver(score, distance);
          return false;
        } else {
          // Collect item
          let points = 0;
          const multiplier = isPowerUp ? 2 : 1;
          
          switch (item.type) {
            case 'lead-qualificado': points = 10 * multiplier; break;
            case 'lead-morno': points = 5 * multiplier; break;
            case 'contrato': points = 50 * multiplier; break;
            case 'powerup':
              setIsPowerUp(true);
              state.powerUpTimer = 180; // 3 seconds at 60fps
              break;
          }
          
          setScore(s => s + points);
          return false;
        }
      }

      // Draw item
      const colors = {
        'lead-qualificado': '#10b981',
        'lead-morno': '#3b82f6',
        'contrato': '#fbbf24',
        'powerup': '#f59e0b',
        'obstacle': '#ef4444',
      };

      const emojis = {
        'lead-qualificado': '🟢',
        'lead-morno': '🔵',
        'contrato': '📄',
        'powerup': '⭐',
        'obstacle': '🚧',
      };

      ctx.fillStyle = colors[item.type];
      ctx.fillRect(item.x, item.y, item.width, item.height);
      ctx.font = '20px Arial';
      ctx.fillText(emojis[item.type], item.x + 5, item.y + 22);

      return true;
    });

    // Create new items
    state.frameCount++;
    if (state.frameCount % 60 === 0) {
      createItem();
    }

    // Update distance and speed
    if (state.frameCount % 10 === 0) {
      setDistance(d => d + 10);
    }

    if (state.frameCount % 300 === 0) {
      state.speed += 0.5; // Increase difficulty
    }

    // Update power-up
    if (state.powerUpTimer > 0) {
      state.powerUpTimer--;
      if (state.powerUpTimer === 0) {
        setIsPowerUp(false);
      }
    }

    // Draw score and distance
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`Pontos: ${score}`, 10, 30);
    ctx.fillText(`Distância: ${distance}m`, 10, 55);
    if (isPowerUp) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('⭐ 2x PONTOS!', canvas.width - 120, 30);
    }

  }, [score, distance, isPowerUp, isGameOver, createItem, checkCollision, onGameOver]);

  useEffect(() => {
    const interval = setInterval(gameLoop, 1000 / 60); // 60 FPS
    return () => clearInterval(interval);
  }, [gameLoop]);

  const handleJump = useCallback(() => {
    const state = gameState.current;
    if (!state.player.isJumping && !isGameOver) {
      state.player.isJumping = true;
      state.player.velocityY = JUMP_FORCE;
    }
  }, [isGameOver]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === ' ') {
        e.preventDefault();
        handleJump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleJump]);

  const handleCanvasClick = () => {
    handleJump();
  };

  // Mobile gamepad buttons for Caça Leads
  const gamepadButtons: GamepadButton[] = [
    {
      id: 'jump',
      label: '↑',
      icon: '⬆️',
      position: 'right',
      onPress: handleJump,
    },
  ];

  return (
    <div className="space-y-4 relative">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">🎮 Caça Leads</h3>
        <p className="text-sm text-gray-600">Clique ou pressione ↑ para pular</p>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        onClick={handleCanvasClick}
        className="w-full border-2 border-purple-200 rounded-2xl cursor-pointer bg-gradient-to-b from-sky-100 to-white"
      />

      <div className="rounded-xl bg-purple-50 p-4 text-sm">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div>🟢 Lead Qualificado: +10</div>
          <div>🔵 Lead Morno: +5</div>
          <div>📄 Contrato: +50</div>
          <div>⭐ Power-up: 2x pontos</div>
          <div>🚧 Obstáculo: Game Over</div>
        </div>
      </div>

      <MobileGamepad buttons={gamepadButtons} />
    </div>
  );
}
