/**
 * Lobby Scene - Room Selection
 * Players can create or join game rooms
 */

import * as Phaser from 'phaser';
import type { Socket } from 'socket.io-client';

export class LobbyScene extends Phaser.Scene {
  private socket?: Socket;
  private rooms: Array<{ name: string; players: number; maxPlayers: number }> = [];
  private selectedRoom?: string;

  constructor() {
    super({ key: 'LobbyScene' });
  }

  init(data: { socket: Socket; player: any }) {
    this.socket = data.socket;
    this.registry.set('player', data.player);
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Title
    this.add.text(width / 2, 50, 'Lead City - Lobby', {
      font: '32px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Instructions
    this.add.text(width / 2, 100, 'Escolha uma sala para jogar', {
      font: '18px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Request rooms from server
    if (this.socket) {
      this.socket.emit('get-rooms');
      
      this.socket.on('rooms-list', (rooms: any[]) => {
        this.rooms = rooms;
        this.displayRooms();
      });

      this.socket.on('room-joined', (data: any) => {
        // Start game scene
        this.scene.start('GameScene', { 
          socket: this.socket,
          roomName: data.roomName,
          players: data.players,
          player: this.registry.get('player')
        });
      });

      this.socket.on('error', (data: any) => {
        console.error('Socket error:', data.message);
      });
    }

    // Create default room button
    this.createButton(width / 2, height - 100, 'Criar Sala "Geral"', () => {
      if (this.socket) {
        this.socket.emit('create-room', {
          roomName: 'Geral',
          player: this.registry.get('player')
        });
      }
    });
  }

  private displayRooms() {
    // Clear previous room displays
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
          this.socket.emit('join-room', {
            roomName: room.name,
            player: this.registry.get('player')
          });
        }
      });
      y += 60;
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
