/**
 * Boot Scene - Asset Loading
 * Loads all game assets and initializes the game
 */

import * as Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Show loading progress
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);
    
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Lead City - Carregando...',
      style: {
        font: '20px Arial',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);
    
    const percentText = this.make.text({
      x: width / 2,
      y: height / 2,
      text: '0%',
      style: {
        font: '18px Arial',
        color: '#ffffff'
      }
    });
    percentText.setOrigin(0.5, 0.5);
    
    this.load.on('progress', (value: number) => {
      percentText.setText(parseInt(String(value * 100)) + '%');
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });
    
    // Load assets (we'll use text/shapes for simplicity, can be replaced with images)
    // For MVP, we'll use Phaser's built-in graphics
  }

  create() {
    // Go to Lobby scene
    this.scene.start('LobbyScene');
  }
}
