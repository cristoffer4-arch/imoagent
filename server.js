#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Custom server to run Socket.IO alongside Next.js
 * This allows real-time multiplayer functionality for Lead City game
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Game state management
const rooms = new Map();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || `http://${hostname}:${port}`,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('🎮 Client connected:', socket.id);

    // ========================================
    // NOTIFICATION EVENTS (IA Busca Module)
    // ========================================

    // Subscribe to property notifications
    socket.on('subscribe-notifications', (data) => {
      const { userId } = data;
      if (userId) {
        socket.join(`notifications:${userId}`);
        console.log(`📬 User ${userId} subscribed to notifications`);
      }
    });

    // Unsubscribe from notifications
    socket.on('unsubscribe-notifications', (data) => {
      const { userId } = data;
      if (userId) {
        socket.leave(`notifications:${userId}`);
        console.log(`📪 User ${userId} unsubscribed from notifications`);
      }
    });

    // Send property match notification (server-side trigger)
    socket.on('send-property-match', (data) => {
      const { userId, match } = data;
      if (userId && match) {
        io.to(`notifications:${userId}`).emit('property-match', match);
        console.log(`🏠 Property match sent to user ${userId}`);
      }
    });

    // Send price change notification
    socket.on('send-price-change', (data) => {
      const { userId, priceChange } = data;
      if (userId && priceChange) {
        io.to(`notifications:${userId}`).emit('price-change', priceChange);
        console.log(`💰 Price change notification sent to user ${userId}`);
      }
    });

    // Send new property notification
    socket.on('send-new-property', (data) => {
      const { userId, property } = data;
      if (userId && property) {
        io.to(`notifications:${userId}`).emit('new-property', property);
        console.log(`🆕 New property notification sent to user ${userId}`);
      }
    });

    // ========================================
    // GAME EVENTS (Lead City)
    // ========================================

    // Get rooms list
    socket.on('get-rooms', () => {
      const roomsList = Array.from(rooms.entries()).map(([name, room]) => ({
        name,
        players: room.players.size,
        maxPlayers: 8
      }));
      socket.emit('rooms-list', roomsList);
    });

    // Create room
    socket.on('create-room', (data) => {
      const { roomName, player } = data;
      
      if (rooms.has(roomName)) {
        socket.emit('error', { message: 'Sala já existe' });
        return;
      }

      rooms.set(roomName, {
        players: new Map([[socket.id, { ...player, id: socket.id, position: { x: 50, y: 250 }, score: 0, leads: 0 }]]),
        startedAt: new Date()
      });

      socket.join(roomName);
      socket.emit('room-joined', { roomName, players: Array.from(rooms.get(roomName).players.values()) });
      io.emit('rooms-updated');
      
      console.log(`✅ Room created: ${roomName} by ${player.username}`);
    });

    // Join room
    socket.on('join-room', (data) => {
      const { roomName, player } = data;
      
      const room = rooms.get(roomName);
      if (!room) {
        socket.emit('error', { message: 'Sala não encontrada' });
        return;
      }

      if (room.players.size >= 8) {
        socket.emit('error', { message: 'Sala está cheia' });
        return;
      }

      room.players.set(socket.id, { ...player, id: socket.id, position: { x: 50, y: 250 }, score: 0, leads: 0 });
      socket.join(roomName);
      
      const players = Array.from(room.players.values());
      io.to(roomName).emit('player-joined', { player: { ...player, id: socket.id }, players });
      socket.emit('room-joined', { roomName, players });
      io.emit('rooms-updated');
      
      console.log(`✅ ${player.username} joined room: ${roomName}`);
    });

    // Update player position
    socket.on('update-position', (data) => {
      const { roomName, position } = data;
      const room = rooms.get(roomName);
      
      if (room && room.players.has(socket.id)) {
        const player = room.players.get(socket.id);
        player.position = position;
        
        socket.to(roomName).emit('player-moved', {
          playerId: socket.id,
          position
        });
      }
    });

    // Collect item
    socket.on('collect-item', (data) => {
      const { roomName, itemId, points } = data;
      const room = rooms.get(roomName);
      
      if (room && room.players.has(socket.id)) {
        const player = room.players.get(socket.id);
        player.score += points;
        player.leads += 1;
        
        io.to(roomName).emit('item-collected', {
          playerId: socket.id,
          itemId,
          score: player.score,
          leads: player.leads
        });
        
        const rankings = Array.from(room.players.values())
          .sort((a, b) => b.score - a.score)
          .map((p, index) => ({
            playerId: p.id,
            username: p.username,
            score: p.score,
            position: index + 1
          }));
        
        io.to(roomName).emit('rankings-updated', rankings);
      }
    });

    // Game over
    socket.on('game-over', (data) => {
      const { roomName, finalScore, distance } = data;
      const room = rooms.get(roomName);
      
      if (room && room.players.has(socket.id)) {
        socket.to(roomName).emit('player-finished', {
          playerId: socket.id,
          score: finalScore,
          distance
        });
      }
    });

    // Leave room
    socket.on('leave-room', (roomName) => {
      const room = rooms.get(roomName);
      if (room) {
        room.players.delete(socket.id);
        socket.leave(roomName);
        
        if (room.players.size === 0) {
          rooms.delete(roomName);
        } else {
          io.to(roomName).emit('player-left', {
            playerId: socket.id,
            players: Array.from(room.players.values())
          });
        }
        
        io.emit('rooms-updated');
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
      
      rooms.forEach((room, roomName) => {
        if (room.players.has(socket.id)) {
          room.players.delete(socket.id);
          
          if (room.players.size === 0) {
            rooms.delete(roomName);
          } else {
            io.to(roomName).emit('player-left', {
              playerId: socket.id,
              players: Array.from(room.players.values())
            });
          }
          
          io.emit('rooms-updated');
        }
      });
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`✨ Ready on http://${hostname}:${port}`);
      console.log(`🎮 Socket.IO server ready for Lead City multiplayer`);
    });
});
