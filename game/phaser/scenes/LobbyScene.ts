/**
 * Lobby Scene - Quick Start
 * Simple start screen with a single "Play" button
 */
import * as Phaser from 'phaser';

interface Player {
  id: string;
  username: string;
  avatar: string;
}

export class LobbyScene extends Phaser.Scene {
  private socket?: unknown;

  constructor() {
    super({ key: 'LobbyScene' });
  }

  init(data: { socket: unknown; player: Player }) {
    this.socket = data.socket;
    this.registry.set('player', data.player);
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Title
    this.add.text(width / 2, 50, 'Lead City', {
      font: 'bold 48px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, 110, 'Capture leads e conquiste a cidade!', {
      font: '20px Arial',
      color: '#cccccc'
    }).setOrigin(0.5);

    // Game icon/emoji
    this.add.text(width / 2, height / 2 - 80, '🏛️', {
      font: '80px Arial'
    }).setOrigin(0.5);

    // Main Play Button
    this.createButton(width / 2, height / 2 + 40, '🎮 Jogar', () => {
      this.startGame();
    });

    // Instructions
    this.add.text(width / 2, height - 80, 'Use setas ou WASD para mover | Espaço para pular', {
      font: '14px Arial',
      color: '#888888',
      align: 'center'
    }).setOrigin(0.5);
  }

  private startGame() {
    // Start game directly in solo mode
    this.scene.start('GameScene', { 
      socket: null, // No socket needed for solo
      roomName: null,
      players: [this.registry.get('player')],
      player: this.registry.get('player'),
      gameMode: 'solo'
    });
  }

  private createButton(x: number, y: number, text: string, onClick: () => void) {
    const button = this.add.rectangle(x, y, 250, 60, 0x6366f1);
    const buttonText = this.add.text(x, y, text, {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    button.setInteractive({ useHandCursor: true });
    
    // Hover effects
    button.on('pointerover', () => {
      button.setFillStyle(0x818cf8);
      button.setScale(1.05);
    });
    
    button.on('pointerout', () => {
      button.setFillStyle(0x6366f1);
      button.setScale(1.0);
    });
    
    button.on('pointerdown', onClick);

    return { button, buttonText };
  }
}
