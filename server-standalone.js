// Servidor Socket.IO Standalone para Lead City Multiplayer Game
// Deploy no Render.com para suportar WebSocket persistente

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configurar CORS para permitir conexões do Netlify
const io = new Server(server, {
  cors: {
    origin: [
      'https://luxeagent.netlify.app',
      'http://localhost:3001',
      'http://localhost:3000'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Health check endpoint para Render
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Lead City Socket.IO Server',
    connections: io.engine.clientsCount,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Armazenar salas ativas e jogadores
const rooms = new Map();
const players = new Map();

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] Player connected: ${socket.id}`);

  // Criar ou entrar numa sala
  socket.on('create-room', ({ roomName, playerName }) => {
    const roomId = roomName || 'Geral';
    
    // Sair de salas anteriores
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });

    // Entrar na nova sala
    socket.join(roomId);
    
    // Registrar jogador
    const player = {
      id: socket.id,
      name: playerName || `Player_${socket.id.substring(0, 4)}`,
      room: roomId,
      x: 100,
      y: 100,
      score: 0
    };
    
    players.set(socket.id, player);
    
    // Atualizar ou criar sala
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        id: roomId,
        players: new Set([socket.id]),
        createdAt: Date.now()
      });
    } else {
      rooms.get(roomId).players.add(socket.id);
    }

    console.log(`Player ${player.name} joined room ${roomId}`);
    
    // Notificar jogador que entrou
    socket.emit('room-joined', {
      roomId,
      playerId: socket.id,
      player
    });
    
    // Enviar lista de jogadores na sala
    const roomPlayers = Array.from(rooms.get(roomId).players)
      .map(id => players.get(id))
      .filter(p => p);
    
    socket.emit('players-list', roomPlayers);
    
    // Notificar outros jogadores
    socket.to(roomId).emit('player-joined', player);
  });

  // Atualizar posição do jogador
  socket.on('player-movement', (data) => {
    const player = players.get(socket.id);
    if (player && player.room) {
      // Atualizar posição
      player.x = data.x;
      player.y = data.y;
      if (data.animation) player.animation = data.animation;
      if (data.flipX !== undefined) player.flipX = data.flipX;
      
      // Broadcast para outros jogadores na mesma sala
      socket.to(player.room).emit('player-moved', {
        playerId: socket.id,
        ...data
      });
    }
  });

  // Coletar lead/contrato
  socket.on('collect-item', (data) => {
    const player = players.get(socket.id);
    if (player && player.room) {
      player.score += data.points || 0;
      
      // Broadcast para todos na sala
      io.to(player.room).emit('item-collected', {
        playerId: socket.id,
        itemId: data.itemId,
        points: data.points,
        playerScore: player.score
      });
    }
  });

  // Chat message
  socket.on('chat-message', (message) => {
    const player = players.get(socket.id);
    if (player && player.room) {
      io.to(player.room).emit('chat-message', {
        playerId: socket.id,
        playerName: player.name,
        message,
        timestamp: Date.now()
      });
    }
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    
    if (player && player.room) {
      console.log(`Player ${player.name} disconnected from room ${player.room}`);
      
      // Remover jogador da sala
      const room = rooms.get(player.room);
      if (room) {
        room.players.delete(socket.id);
        
        // Remover sala se vazia
        if (room.players.size === 0) {
          rooms.delete(player.room);
          console.log(`Room ${player.room} deleted (empty)`);
        } else {
          // Notificar outros jogadores
          socket.to(player.room).emit('player-left', {
            playerId: socket.id,
            playerName: player.name
          });
        }
      }
    }
    
    players.delete(socket.id);
    console.log(`Total players: ${players.size}, Total rooms: ${rooms.size}`);
  });
});

// Porta do servidor (Render injeta automaticamente a PORT)
const PORT = process.env.PORT || 3002;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(`🎮 Lead City Socket.IO Server ONLINE`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`📡 WebSocket ready for connections`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log(`========================================\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
