/**
 * Game Scene - Main Platformer Gameplay
 * Multiplayer 2D platformer with real-time synchronization
 */

import * as Phaser from 'phaser';
import { GAME_CONSTANTS } from '../config/gameConfig';

interface Player {
  id: string;
  username: string;
  avatar: string;
  position: { x: number; y: number };
  score: number;
  leads: number;
}

export class GameScene extends Phaser.Scene {
  private socket?: unknown;
  private roomName?: string;
  private player?: Phaser.Physics.Arcade.Sprite;
  private playerData?: Player;
  private otherPlayers: Map<string, { sprite: Phaser.Physics.Arcade.Sprite; text: Phaser.GameObjects.Text }> = new Map();
  
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys?: {
    up: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
  };
  
  private items?: Phaser.Physics.Arcade.Group;
  private obstacles?: Phaser.Physics.Arcade.Group;
  
  private score = 0;
  private leads = 0;
  private distance = 0;
  private isPowerUp = false;
  private powerUpTimer?: Phaser.Time.TimerEvent;
  
  private scoreText?: Phaser.GameObjects.Text;
  private leadsText?: Phaser.GameObjects.Text;
  private timerText?: Phaser.GameObjects.Text;
  private rankingText?: Phaser.GameObjects.Text;
  
  private gameTime = GAME_CONSTANTS.GAME_DURATION;
  private itemSpawnTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { socket: unknown; roomName: string; players: Player[]; player: Player }) {
    this.socket = data.socket;
    this.roomName = data.roomName;
    this.playerData = data.player;
    
    // Initialize other players - will be created in create()
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Sky background
    this.add.rectangle(width / 2, height / 2, width, height, 0x87CEEB);

    // Ground
    const ground = this.add.rectangle(width / 2, height - 25, width, 50, 0x8B4513);
    this.physics.add.existing(ground, true);

    // Buildings background
    this.createBuildings();

    // Create player
    this.player = this.physics.add.sprite(100, height - 100, '');
    this.player.setDisplaySize(30, 40);
    this.player.setTint(0x3b82f6);
    this.physics.add.collider(this.player, ground);
    
    // Player name label
    this.add.text(100, height - 140, this.playerData?.username || 'Você', {
      font: '12px Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);

    // Items and obstacles groups
    this.items = this.physics.add.group();
    this.obstacles = this.physics.add.group();

    // Input
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasdKeys = this.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE
    }) as {
      up: Phaser.Input.Keyboard.Key;
      left: Phaser.Input.Keyboard.Key;
      down: Phaser.Input.Keyboard.Key;
      right: Phaser.Input.Keyboard.Key;
      space: Phaser.Input.Keyboard.Key;
    };

    // Collisions
    this.physics.add.overlap(
      this.player,
      this.items,
      (player, item) => this.collectItem(player as Phaser.Physics.Arcade.Sprite, item as Phaser.Physics.Arcade.Sprite),
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.obstacles,
      (player, obstacle) => this.hitObstacle(player as Phaser.Physics.Arcade.Sprite, obstacle as Phaser.Physics.Arcade.Sprite),
      undefined,
      this
    );

    // HUD
    this.createHUD();

    // Socket events
    this.setupSocketEvents();

    // Spawn items periodically
    this.itemSpawnTimer = this.time.addEvent({
      delay: GAME_CONSTANTS.ITEM_SPAWN_INTERVAL,
      callback: this.spawnItem,
      callbackScope: this,
      loop: true
    });

    // Game timer
    this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    });
  }

  update() {
    if (!this.player || !this.cursors || !this.wasdKeys) return;

    // Player movement
    const speed = GAME_CONSTANTS.PLAYER_SPEED;
    
    if (this.cursors.left.isDown || this.wasdKeys.left.isDown) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right.isDown || this.wasdKeys.right.isDown) {
      this.player.setVelocityX(speed);
    } else {
      this.player.setVelocityX(0);
    }

    // Jump
    if ((this.cursors.up.isDown || this.wasdKeys.up.isDown || this.wasdKeys.space.isDown) && 
        this.player.body && (this.player.body as Phaser.Physics.Arcade.Body).touching.down) {
      this.player.setVelocityY(GAME_CONSTANTS.PLAYER_JUMP_VELOCITY);
    }

    // Update distance
    this.distance += Math.abs(this.player.body?.velocity.x || 0) * 0.001;

    // Sync position with other players
    if (this.socket && this.roomName) {
      (this.socket as any).emit('update-position', {
        roomName: this.roomName,
        position: { x: this.player.x, y: this.player.y }
      });
    }

    // Keep player on screen
    if (this.player.x < 0) this.player.x = 0;
    if (this.player.x > this.cameras.main.width) this.player.x = this.cameras.main.width;
  }

  private createBuildings() {
    const height = this.cameras.main.height;
    
    // Simple building silhouettes
    for (let i = 0; i < 5; i++) {
      const buildingHeight = Phaser.Math.Between(100, 250);
      const buildingWidth = Phaser.Math.Between(60, 120);
      const x = i * 180 + 50;
      
      this.add.rectangle(x, height - buildingHeight / 2 - 50, buildingWidth, buildingHeight, 0x4a5568, 0.5);
    }
  }

  private createHUD() {
    const padding = 10;
    
    // Score
    this.scoreText = this.add.text(padding, padding, 'Pontos: 0', {
      font: 'bold 16px Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });

    // Leads
    this.leadsText = this.add.text(padding, padding + 30, 'Leads: 0', {
      font: 'bold 16px Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });

    // Timer
    this.timerText = this.add.text(this.cameras.main.width / 2, padding, `Tempo: ${this.gameTime}s`, {
      font: 'bold 16px Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5, 0);

    // Ranking placeholder
    this.rankingText = this.add.text(this.cameras.main.width - padding, padding, '🏆 Ranking\n1º: --', {
      font: '14px Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 },
      align: 'right'
    }).setOrigin(1, 0);
  }

  private setupSocketEvents() {
    if (!this.socket) return;

    const socket = this.socket as any;

    // Player joined
    socket.on('player-joined', (data: { player: Player; players: Player[] }) => {
      console.log('Player joined:', data.player.username);
      // Could add visual notification
    });

    // Player moved
    socket.on('player-moved', (data: { playerId: string; position: { x: number; y: number } }) => {
      let otherPlayer = this.otherPlayers.get(data.playerId);
      
      if (!otherPlayer) {
        // Create new player sprite
        const sprite = this.physics.add.sprite(data.position.x, data.position.y, '');
        sprite.setDisplaySize(30, 40);
        sprite.setTint(0xef4444);
        
        const text = this.add.text(data.position.x, data.position.y - 40, '?', {
          font: '12px Arial',
          color: '#ffffff',
          backgroundColor: '#000000',
          padding: { x: 4, y: 2 }
        }).setOrigin(0.5);
        
        this.otherPlayers.set(data.playerId, { sprite, text });
        otherPlayer = { sprite, text };
      }
      
      // Smooth movement
      this.tweens.add({
        targets: otherPlayer.sprite,
        x: data.position.x,
        y: data.position.y,
        duration: 100,
        ease: 'Linear'
      });
      
      otherPlayer.text.setPosition(data.position.x, data.position.y - 40);
    });

    // Item collected by any player
    socket.on('item-collected', (data: { playerId: string; itemId: string }) => {
      // Remove item from scene
      this.items?.getChildren().forEach((item) => {
        const gameObject = item as Phaser.Physics.Arcade.Sprite;
        if (gameObject.getData('id') === data.itemId) {
          gameObject.destroy();
        }
      });
    });

    // Rankings updated
    socket.on('rankings-updated', (rankings: Array<{ playerId: string; username: string; score: number; position: number }>) => {
      let rankingText = '🏆 Ranking\n';
      rankings.slice(0, 3).forEach(r => {
        const emoji = r.position === 1 ? '🥇' : r.position === 2 ? '🥈' : '🥉';
        rankingText += `${emoji} ${r.username}: ${r.score}\n`;
      });
      this.rankingText?.setText(rankingText);
    });

    // Player left
    socket.on('player-left', (data: { playerId: string }) => {
      const otherPlayer = this.otherPlayers.get(data.playerId);
      if (otherPlayer) {
        otherPlayer.sprite.destroy();
        otherPlayer.text.destroy();
        this.otherPlayers.delete(data.playerId);
      }
    });
  }

  private spawnItem() {
    const types = ['lead-qualificado', 'lead-morno', 'contrato', 'powerup', 'obstacle'];
    const weights = [40, 30, 5, 10, 15];
    
    const rand = Math.random() * 100;
    let cumulative = 0;
    let selectedType = types[0];
    
    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (rand <= cumulative) {
        selectedType = types[i];
        break;
      }
    }

    const x = this.cameras.main.width + 50;
    const y = selectedType === 'obstacle' ? this.cameras.main.height - 75 : Phaser.Math.Between(150, 400);
    
    let item: Phaser.Physics.Arcade.Sprite;
    
    if (selectedType === 'obstacle') {
      item = this.obstacles!.create(x, y, '') as Phaser.Physics.Arcade.Sprite;
      item.setDisplaySize(30, 30);
      item.setTint(0xff0000);
      if (item.body) (item.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    } else {
      item = this.items!.create(x, y, '') as Phaser.Physics.Arcade.Sprite;
      item.setDisplaySize(20, 20);
      
      if (selectedType === 'lead-qualificado') item.setTint(0x22c55e);
      else if (selectedType === 'lead-morno') item.setTint(0x3b82f6);
      else if (selectedType === 'contrato') item.setTint(0xfbbf24);
      else if (selectedType === 'powerup') item.setTint(0xa855f7);
      
      if (item.body) (item.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    }
    
    item.setData('type', selectedType);
    item.setData('id', `item-${Date.now()}-${Math.random()}`);
    item.setVelocityX(-GAME_CONSTANTS.OBSTACLE_SPEED);
  }

  private collectItem(_player: Phaser.Physics.Arcade.Sprite, item: Phaser.Physics.Arcade.Sprite) {
    const type = item.getData('type');
    const itemId = item.getData('id');
    
    if (type === 'powerup') {
      this.activatePowerUp();
    } else {
      const pointsMap: Record<string, number> = GAME_CONSTANTS.LEAD_POINTS;
      const points = pointsMap[type] || 10;
      const finalPoints = this.isPowerUp ? points * GAME_CONSTANTS.POWERUP_MULTIPLIER : points;
      
      this.score += finalPoints;
      this.leads += 1;
      
      this.scoreText?.setText(`Pontos: ${this.score}`);
      this.leadsText?.setText(`Leads: ${this.leads}`);
      
      // Notify server
      if (this.socket && this.roomName) {
        (this.socket as any).emit('collect-item', {
          roomName: this.roomName,
          itemId: itemId,
          points: finalPoints
        });
      }
    }
    
    item.destroy();
  }

  private hitObstacle(_player: Phaser.Physics.Arcade.Sprite, _obstacle: Phaser.Physics.Arcade.Sprite) {
    // Game over
    this.endGame();
  }

  private activatePowerUp() {
    this.isPowerUp = true;
    this.player?.setTint(0xffd700);
    
    if (this.powerUpTimer) {
      this.powerUpTimer.remove();
    }
    
    this.powerUpTimer = this.time.delayedCall(GAME_CONSTANTS.POWERUP_DURATION, () => {
      this.isPowerUp = false;
      this.player?.setTint(0x3b82f6);
    });
  }

  private updateTimer() {
    this.gameTime--;
    this.timerText?.setText(`Tempo: ${this.gameTime}s`);
    
    if (this.gameTime <= 0) {
      this.endGame();
    }
  }

  private endGame() {
    // Notify server
    if (this.socket && this.roomName) {
      (this.socket as any).emit('game-over', {
        roomName: this.roomName,
        finalScore: this.score,
        distance: Math.round(this.distance)
      });
    }

    // Stop timers
    this.itemSpawnTimer?.remove();
    
    // Return data to React component
    this.registry.set('gameResult', {
      score: this.score,
      leads: this.leads,
      distance: Math.round(this.distance)
    });
    
    // Could transition to results scene or let React handle it
    this.scene.pause();
  }

  shutdown() {
    // Cleanup
    this.otherPlayers.forEach(p => {
      p.sprite.destroy();
      p.text.destroy();
    });
    this.otherPlayers.clear();
  }
}
