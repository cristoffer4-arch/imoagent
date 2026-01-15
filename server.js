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

  // Notification management
  const userSockets = new Map(); // userId -> Set of socket IDs

  io.on('connection', (socket) => {
    console.log('🎮 Client connected:', socket.id);
    
    // Handle notification subscription
    const userId = socket.handshake.auth?.userId;
    if (userId) {
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);
      console.log(`📧 User ${userId} subscribed to notifications`);
    }

    // Subscribe to notifications for a specific user
    socket.on('subscribe-notifications', (data) => {
      const { userId } = data;
      if (!userId) return;
      
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);
      console.log(`📧 User ${userId} subscribed to notifications`);
    });

    // Unsubscribe from notifications
    socket.on('unsubscribe-notifications', (data) => {
      const { userId } = data;
      if (!userId) return;
      
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
      console.log(`📧 User ${userId} unsubscribed from notifications`);
    });

    // Mark notification as read
    socket.on('notification-read', (data) => {
      const { notificationId } = data;
      console.log(`✅ Notification ${notificationId} marked as read`);
      // Emit to all user's sockets
      if (userId && userSockets.has(userId)) {
        userSockets.get(userId).forEach(socketId => {
          io.to(socketId).emit('notification-read', { notificationId });
        });
      }
    });

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
      
      // Remove from notification subscriptions
      const userId = socket.handshake.auth?.userId;
      if (userId && userSockets.has(userId)) {
        userSockets.get(userId).delete(socket.id);
        if (userSockets.get(userId).size === 0) {
          userSockets.delete(userId);
        }
      }
      
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

  // Helper function to broadcast notifications to specific users
  // Can be called from Netlify functions or other parts of the application
  global.broadcastNotification = function(userId, notification) {
    if (userSockets.has(userId)) {
      userSockets.get(userId).forEach(socketId => {
        io.to(socketId).emit('notification', notification);
      });
      console.log(`📧 Notification sent to user ${userId}:`, notification.type);
    }
  };

  // Helper function to broadcast property match to specific users
  global.broadcastPropertyMatch = function(userId, matchData) {
    if (userSockets.has(userId)) {
      userSockets.get(userId).forEach(socketId => {
        io.to(socketId).emit('property-match', matchData);
      });
      console.log(`🎯 Property match sent to user ${userId}`);
    }
  };

  // Helper function to broadcast price changes
  global.broadcastPriceChange = function(userId, priceChangeData) {
    if (userSockets.has(userId)) {
      userSockets.get(userId).forEach(socketId => {
        io.to(socketId).emit('price-change', priceChangeData);
      });
      console.log(`💰 Price change sent to user ${userId}`);
    }
  };

  // Helper function to broadcast new property
  global.broadcastNewProperty = function(userId, propertyData) {
    if (userSockets.has(userId)) {
      userSockets.get(userId).forEach(socketId => {
        io.to(socketId).emit('new-property', propertyData);
      });
      console.log(`🆕 New property sent to user ${userId}`);
    }
  };

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`✨ Ready on http://${hostname}:${port}`);
      console.log(`🎮 Socket.IO server ready for Lead City multiplayer`);
      console.log(`📧 Socket.IO server ready for real-time notifications`);
    });
});
