/**
 * Lobby Scene - Game Mode Selection
 * Players can choose to play solo or in team mode
 */
import * as Phaser from 'phaser';

interface Player {
  id: string;
  username: string;
  avatar: string;
}

export class LobbyScene extends Phaser.Scene {
  private socket?: unknown;
  private rooms: Array<{ name: string; players: number; maxPlayers: number }> = [];
  private selectedRoom?: string;
  private gameMode?: 'solo' | 'team';

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
      font: '32px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Instructions
    this.add.text(width / 2, 100, 'Escolha o modo de jogo', {
      font: '18px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Solo Mode Button
    this.createButton(width / 2, height / 2 - 50, '🏃 Jogar Sozinho', () => {
      this.gameMode = 'solo';
      this.startSoloGame();
    });

    // Team Mode Button  
    this.createButton(width / 2, height / 2 + 50, '👥 Jogar em Equipe', () => {
      this.gameMode = 'team';
      this.showTeamOptions();
    });
  }

  private startSoloGame() {
    // Start game directly in solo mode
    this.scene.start('GameScene', { 
      socket: null, // No socket needed for solo
      roomName: null,
      players: [this.registry.get('player')],
      player: this.registry.get('player'),
      gameMode: 'solo'
    });
  }

  private showTeamOptions() {
    // Clear previous UI
    this.children.removeAll();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Title
    this.add.text(width / 2, 50, 'Jogar em Equipe', {
      font: '32px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Instructions
    this.add.text(width / 2, 100, 'Escolha um parceiro da sua diretoria ou crie uma sala', {
      font: '16px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Back button
    this.createButton(width / 2, height - 50, '← Voltar', () => {
      this.create(); // Recreate main menu
    });

    // Request rooms from server
    if (this.socket) {
      const socket = this.socket as any;
      socket.emit('get-rooms');
      
      socket.on('rooms-list', (rooms: Array<{ name: string; players: number; maxPlayers: number }>) => {
        this.rooms = rooms;
        this.displayTeamRooms();
      });

      socket.on('room-joined', (data: { roomName: string; players: Player[] }) => {
        // Start game scene
        this.scene.start('GameScene', { 
          socket: this.socket,
          roomName: data.roomName,
          players: data.players,
          player: this.registry.get('player'),
          gameMode: 'team'
        });
      });

      socket.on('error', (data: { message: string }) => {
        console.error('Socket error:', data.message);
        this.showError(data.message);
      });
    }

    // Create room button
    this.createButton(width / 2, height / 2 + 100, '➕ Criar Nova Sala', () => {
      const player = this.registry.get('player');
      const roomName = `Sala de ${player.username}`;
      
      if (this.socket) {
        (this.socket as any).emit('create-room', {
          roomName: roomName,
          player: player
        });
      }
    });
  }

  private displayTeamRooms() {
    const width = this.cameras.main.width;
    let y = 150;

    if (this.rooms.length === 0) {
      this.add.text(width / 2, y, 'Nenhuma sala disponível. Crie uma!', {
        font: '16px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      return;
    }

    this.rooms.forEach((room) => {
      const roomText = `${room.name} (${room.players}/${room.maxPlayers})`;
      this.createButton(width / 2, y, roomText, () => {
        if (this.socket) {
          (this.socket as any).emit('join-room', {
            roomName: room.name,
            player: this.registry.get('player')
          });
        }
      });
      y += 60;
    });
  }

  private showError(message: string) {
    const width = this.cameras.main.width;
    const errorText = this.add.text(width / 2, 500, message, {
      font: '16px Arial',
      color: '#ff0000',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5);

    // Remove error after 3 seconds
    this.time.delayedCall(3000, () => {
      errorText.destroy();
    });
  }

  private createButton(x: number, y: number, text: string, onClick: () => void) {
    const button = this.add.rectangle(x, y, 300, 50, 0x6366f1);
    const buttonText = this.add.text(x, y, text, {
      font: '16px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    button.setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setFillStyle(0x818cf8));
    button.on('pointerout', () => button.setFillStyle(0x6366f1));
    button.on('pointerdown', onClick);

    return { button, buttonText };
  }
}
