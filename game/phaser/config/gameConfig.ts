/**
 * Lead City Game Configuration
 * Phaser 3 configuration for the multiplayer platformer game
 */

import * as Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { LobbyScene } from '../scenes/LobbyScene';
import { GameScene } from '../scenes/GameScene';

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-game',
  backgroundColor: '#87CEEB',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 600 },
      debug: false,
    },
  },
  scene: [BootScene, LobbyScene, GameScene],
};

export const GAME_CONSTANTS = {
  PLAYER_SPEED: 200,
  PLAYER_JUMP_VELOCITY: -400,
  LEAD_POINTS: {
    'lead-qualificado': 10,
    'lead-morno': 5,
    'contrato': 50,
  },
  POWERUP_DURATION: 3000, // 3 seconds
  POWERUP_MULTIPLIER: 2,
  OBSTACLE_SPEED: 200,
  ITEM_SPAWN_INTERVAL: 2000, // 2 seconds
  MAX_PLAYERS: 8,
  GAME_DURATION: 120, // 2 minutes
};
