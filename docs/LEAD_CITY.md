# Lead City - Multiplayer 2D Platform Game

## Overview

Lead City is a **multiplayer 2D platformer** built with **Phaser 3** and **Socket.IO** for real-time gameplay. Players compete to collect leads, contracts, and power-ups while avoiding obstacles in an urban cityscape.

## Features

### 🎮 Gameplay
- **Side-scrolling platformer** with smooth physics
- **Real-time multiplayer** with up to 8 players per room
- **Collectibles**: 
  - 🟢 Lead Qualificado (10 pts)
  - 🔵 Lead Morno (5 pts)
  - 📄 Contrato (50 pts - rare)
  - ⭐ Power-up (2x multiplier for 3s)
- **Obstacles**: Red barriers that end the game
- **Game duration**: 120 seconds per match
- **Live rankings** updated in real-time

### 🏆 Multiplayer System
- **Room-based matchmaking**
- Default "Geral" room or custom rooms
- Live player synchronization
- Real-time score tracking
- Persistent leaderboards in Supabase

### 💾 Database Integration
Three Supabase tables:
- `leadcity_players`: Player profiles and stats
- `leadcity_matches`: Match history
- `leadcity_scores`: Individual match scores

## Architecture

### Tech Stack
- **Game Engine**: Phaser 3.80.1
- **Multiplayer**: Socket.IO 4.8.0
- **Frontend**: Next.js 16 + React 19
- **Backend**: Custom Node.js server with Socket.IO
- **Database**: Supabase (PostgreSQL)
- **Language**: TypeScript 5

### Directory Structure

```
game/phaser/
├── config/
│   └── gameConfig.ts       # Game constants and Phaser config
├── scenes/
│   ├── BootScene.ts        # Asset loading
│   ├── LobbyScene.ts       # Room selection
│   └── GameScene.ts        # Main gameplay
src/
├── app/aplicativo/games/leadcity/
│   └── page.tsx            # Game page route
├── components/games/leadcity/
│   └── LeadCityGame.tsx    # React integration component
└── app/api/socket/
    └── route.ts            # Socket.IO endpoint (unused with custom server)
server.js                   # Custom Next.js + Socket.IO server
supabase/schema.sql         # Database tables with RLS policies
```

## Running the Game

### Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start the custom server (includes Socket.IO)
npm run dev

# Access the game at http://localhost:3000/aplicativo/games/leadcity
```

### Production

```bash
# Build
npm run build

# Start production server
npm start
```

## Game Controls

- **Arrow Keys** or **WASD**: Move left/right
- **Space** or **Up Arrow** or **W**: Jump
- Goal: Collect as many leads as possible while avoiding obstacles

## Socket.IO Events

### Client → Server
- `get-rooms`: Request list of available rooms
- `create-room`: Create a new game room
- `join-room`: Join an existing room
- `update-position`: Sync player position (sent continuously)
- `collect-item`: Notify item collection
- `game-over`: Send final score
- `leave-room`: Leave current room

### Server → Client
- `rooms-list`: Available rooms data
- `room-joined`: Confirmation of room join
- `player-joined`: New player joined room
- `player-moved`: Other player position update
- `item-collected`: Item collected by any player
- `rankings-updated`: Live leaderboard update
- `player-left`: Player left room
- `error`: Error message

## Multiplayer Synchronization

The game uses an **authoritative server** model:
1. Each client sends position updates ~60 times/second
2. Server broadcasts to other players in the room
3. Item collection is validated server-side
4. Rankings are calculated server-side and broadcast

## Customization

### Game Constants
Edit `game/phaser/config/gameConfig.ts`:

```typescript
export const GAME_CONSTANTS = {
  PLAYER_SPEED: 200,           // Movement speed
  PLAYER_JUMP_VELOCITY: -400,  // Jump force
  LEAD_POINTS: {               // Points per item
    'lead-qualificado': 10,
    'lead-morno': 5,
    'contrato': 50,
  },
  POWERUP_DURATION: 3000,      // Power-up duration (ms)
  POWERUP_MULTIPLIER: 2,       // Points multiplier
  OBSTACLE_SPEED: 200,         // Item scroll speed
  ITEM_SPAWN_INTERVAL: 2000,   // Spawn rate (ms)
  MAX_PLAYERS: 8,              // Room capacity
  GAME_DURATION: 120,          // Match length (seconds)
};
```

### Spawn Probabilities
Edit `GameScene.ts` → `spawnItem()`:

```typescript
const types = ['lead-qualificado', 'lead-morno', 'contrato', 'powerup', 'obstacle'];
const weights = [40, 30, 5, 10, 15]; // Percentage probability
```

## Troubleshooting

### Socket.IO connection issues
- Ensure `server.js` is running (not `next dev`)
- Check port 3000 is not in use
- Verify `NEXT_PUBLIC_APP_URL` in `.env.local`

### Phaser not loading
- Check browser console for errors
- Ensure Phaser is dynamically imported client-side
- Verify `game/phaser/` files have no server-side code

### Build errors
- Run `npm run lint` to check for TypeScript errors
- Phaser must be imported as `import * as Phaser from 'phaser'`
- Socket types should use `unknown` or `any` to avoid type conflicts

## Future Enhancements

- [ ] Team-based rooms (Equipe Porto, Equipe Lisboa)
- [ ] Daily missions system
- [ ] Power-up variety (speed boost, invincibility)
- [ ] Multiple map themes
- [ ] Mobile touch controls
- [ ] Spectator mode
- [ ] Replay system

## Credits

Built for **ImoAgent** - Real Estate AI Platform
Game Design: Inspired by classic platformers with real estate twist
