import { Server as SocketIOServer } from 'socket.io';
import { NextRequest } from 'next/server';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';

// Extend NextApiResponse to include socket server
interface SocketServer extends HTTPServer {
  io?: SocketIOServer | undefined;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket {
  socket: SocketWithIO;
}

// Game state management
const rooms = new Map<string, {
  players: Map<string, {
    id: string;
    username: string;
    avatar: string;
    position: { x: number; y: number };
    score: number;
    leads: number;
  }>;
  matchId?: string;
  startedAt?: Date;
}>();

export async function GET(req: NextRequest) {
  return new Response(
    JSON.stringify({
      message: 'Socket.IO server should be initialized via server.ts',
      rooms: Array.from(rooms.keys()).map(roomName => ({
        name: roomName,
        players: rooms.get(roomName)?.players.size || 0
      }))
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Initialize Socket.IO server
export function initSocketIO(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

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
    socket.on('create-room', (data: { roomName: string; player: any }) => {
      const { roomName, player } = data;
      
      if (rooms.has(roomName)) {
        socket.emit('error', { message: 'Room already exists' });
        return;
      }

      rooms.set(roomName, {
        players: new Map([[socket.id, { ...player, id: socket.id }]]),
        startedAt: new Date()
      });

      socket.join(roomName);
      socket.emit('room-joined', { roomName, players: Array.from(rooms.get(roomName)!.players.values()) });
      io.emit('rooms-updated');
      
      console.log(`Room created: ${roomName} by ${player.username}`);
    });

    // Join room
    socket.on('join-room', (data: { roomName: string; player: any }) => {
      const { roomName, player } = data;
      
      const room = rooms.get(roomName);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.players.size >= 8) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }

      room.players.set(socket.id, { ...player, id: socket.id });
      socket.join(roomName);
      
      // Notify all players in room
      const players = Array.from(room.players.values());
      io.to(roomName).emit('player-joined', { player: { ...player, id: socket.id }, players });
      socket.emit('room-joined', { roomName, players });
      io.emit('rooms-updated');
      
      console.log(`${player.username} joined room: ${roomName}`);
    });

    // Update player position
    socket.on('update-position', (data: { roomName: string; position: { x: number; y: number } }) => {
      const { roomName, position } = data;
      const room = rooms.get(roomName);
      
      if (room && room.players.has(socket.id)) {
        const player = room.players.get(socket.id)!;
        player.position = position;
        
        // Broadcast to other players in room
        socket.to(roomName).emit('player-moved', {
          playerId: socket.id,
          position
        });
      }
    });

    // Collect item
    socket.on('collect-item', (data: { roomName: string; itemId: string; points: number }) => {
      const { roomName, itemId, points } = data;
      const room = rooms.get(roomName);
      
      if (room && room.players.has(socket.id)) {
        const player = room.players.get(socket.id)!;
        player.score += points;
        player.leads += 1;
        
        // Broadcast to all players in room
        io.to(roomName).emit('item-collected', {
          playerId: socket.id,
          itemId,
          score: player.score,
          leads: player.leads
        });
        
        // Update rankings
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
    socket.on('game-over', (data: { roomName: string; finalScore: number; distance: number }) => {
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
    socket.on('leave-room', (roomName: string) => {
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
      console.log('Client disconnected:', socket.id);
      
      // Remove player from all rooms
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

  return io;
}
