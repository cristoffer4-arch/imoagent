'use client';

import { useEffect, useRef, useState } from 'react';
import socketIOClient from 'socket.io-client';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  getOrCreatePlayer,
  saveMatch,
  checkAndUnlockAchievements,
  type LeadCityPlayer,
  type LeadCityPlayerAchievement,
} from '@/lib/services/leadcity-service';

export function LeadCityGame() {
  // Note: Using 'any' for Phaser.Game and Socket types to avoid complex type conflicts
  // during SSR/build. Game is dynamically imported client-side only.
  const gameRef = useRef<any | null>(null);
  const socketRef = useRef<any | null>(null);
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'finished'>('lobby');
  const [player, setPlayer] = useState<{ id: string; username: string; avatar: string } | null>(null);
  const [leadCityPlayer, setLeadCityPlayer] = useState<LeadCityPlayer | null>(null);
  const [result, setResult] = useState<{ score: number; leads: number; distance: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newAchievements, setNewAchievements] = useState<LeadCityPlayerAchievement[]>([]);
  const [gameStartTime, setGameStartTime] = useState<number>(0);

  useEffect(() => {
    // Initialize Supabase client and get user
    const initPlayer = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get or create player profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        const username = profile?.full_name || 'Consultor';
        
        setPlayer({
          id: user.id,
          username: username,
          avatar: '🏃'
        });

        // Get or create LeadCity player
        try {
          const lcPlayer = await getOrCreatePlayer(user.id, username);
          setLeadCityPlayer(lcPlayer);
        } catch (error) {
          console.error('Error creating LeadCity player:', error);
        }
      } else {
        // Guest player
        setPlayer({
          id: `guest-${Date.now()}`,
          username: 'Convidado',
          avatar: '🏃'
        });
      }
    };

    initPlayer();
  }, []);

  useEffect(() => {
    // Connect to Socket.IO
    if (!socketRef.current) {
const socketUrl = process.env.NEXT_PUBLIC_SOCKETIO_URL || 'http://localhost:10000';
      socketRef.current = socketIOClient(socketUrl)
      socketRef.current.on('connect', () => {
        console.log('Connected to Socket.IO');
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from Socket.IO');
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const startGame = async () => {
    if (!player || !socketRef.current) return;

    setIsLoading(true);
    setGameState('playing');
    setGameStartTime(Date.now());
    setNewAchievements([]);

    try {
      // Dynamically import Phaser and game config
      const Phaser = await import('phaser');
      const { GAME_CONFIG } = await import('@/../game/phaser/config/gameConfig');

      // Initialize Phaser game
      const config = {
        ...GAME_CONFIG,
        parent: 'phaser-game',
      };

      const game = new Phaser.Game(config);
      gameRef.current = game;

      // Pass data to game registry
      game.registry.set('socket', socketRef.current);
      game.registry.set('player', player);
      
      // Monitor for game end
      const checkGameEnd = setInterval(() => {
        const gameResult = game.registry.get('gameResult');
        if (gameResult) {
          setResult(gameResult);
          setGameState('finished');
          clearInterval(checkGameEnd);
          
          // Save to Supabase
          saveGameResult(gameResult);
        }
      }, 500);

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading game:', error);
      setIsLoading(false);
      setGameState('lobby');
    }
  };

  const saveGameResult = async (result: { score: number; leads: number; distance: number }) => {
    if (!player || player.id.startsWith('guest-') || !leadCityPlayer) return;

    try {
      // Calculate time played in seconds
      const timePlayed = Math.floor((Date.now() - gameStartTime) / 1000);

      // Estimate properties acquired (1 per 100 distance)
      const propertiesAcquired = Math.floor(result.distance / 100);

      // Determine if game was completed (score > 1000 or distance > 500)
      const completed = result.score > 1000 || result.distance > 500;

      // Save match using leadCityService
      await saveMatch(leadCityPlayer.id, {
        score: result.score,
        leads_captured: result.leads,
        properties_acquired: propertiesAcquired,
        time_played: timePlayed,
        difficulty: 'normal',
        completed: completed,
      });

      // Check for new achievements
      const unlockedAchievements = await checkAndUnlockAchievements(leadCityPlayer.id);
      if (unlockedAchievements.length > 0) {
        setNewAchievements(unlockedAchievements);
      }
    } catch (error) {
      console.error('Error saving game result:', error);
    }
  };

  const playAgain = () => {
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }
    setResult(null);
    setGameState('lobby');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-purple-50">
      <div className="max-w-6xl mx-auto p-6">
        {gameState === 'lobby' && (
          <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-pink-100/70 p-8 backdrop-blur-sm">
            <div className="text-center space-y-6">
              <div className="text-6xl">🏙️</div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Lead City</h1>
                <p className="text-lg text-gray-600">Multiplayer 2D Platformer</p>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Como Jogar</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="rounded-xl bg-white/70 p-4">
                    <div className="text-2xl mb-2">⌨️</div>
                    <div className="font-semibold text-gray-900">Controles</div>
                    <div className="text-sm text-gray-600">Setas ou WASD para mover<br/>Espaço para pular</div>
                  </div>
                  <div className="rounded-xl bg-white/70 p-4">
                    <div className="text-2xl mb-2">🟢</div>
                    <div className="font-semibold text-gray-900">Leads</div>
                    <div className="text-sm text-gray-600">Colete leads para ganhar pontos<br/>Verde: 10pts | Azul: 5pts</div>
                  </div>
                  <div className="rounded-xl bg-white/70 p-4">
                    <div className="text-2xl mb-2">📄</div>
                    <div className="font-semibold text-gray-900">Contratos</div>
                    <div className="text-sm text-gray-600">Amarelo: 50 pontos (raro)<br/>Máximo valor!</div>
                  </div>
                  <div className="rounded-xl bg-white/70 p-4">
                    <div className="text-2xl mb-2">⭐</div>
                    <div className="font-semibold text-gray-900">Power-ups</div>
                    <div className="text-sm text-gray-600">Roxo: 2x pontos por 3s<br/>Brilho dourado ativo</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-red-50 p-4">
                <div className="flex items-center gap-3 justify-center">
                  <div className="text-3xl">🚧</div>
                  <div className="text-left">
                    <div className="font-semibold text-red-900">Cuidado com Obstáculos!</div>
                    <div className="text-sm text-red-700">Vermelho: Game Over</div>
                  </div>
                </div>
              </div>

              <button
                onClick={startGame}
                disabled={!player || isLoading}
                className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-8 py-4 text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '⏳ Carregando jogo...' : player ? '🎮 Começar Jogo Multiplayer' : '⏳ Carregando...'}
              </button>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-pink-100/70 p-4 backdrop-blur-sm">
            <div id="phaser-game" className="rounded-2xl overflow-hidden" />
          </div>
        )}

        {gameState === 'finished' && result && (
          <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-pink-100/70 p-8 backdrop-blur-sm">
            <div className="text-center space-y-6">
              <div className="text-6xl">🏁</div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Partida Finalizada!</h2>
                <p className="text-gray-600">Confira seu desempenho</p>
              </div>

              {/* New Achievements Notification */}
              {newAchievements.length > 0 && (
                <div className="rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 p-6 space-y-3 animate-pulse">
                  <div className="text-4xl">🎉</div>
                  <h3 className="text-xl font-bold text-gray-900">Novas Conquistas Desbloqueadas!</h3>
                  <div className="space-y-2">
                    {newAchievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-center justify-center gap-2 text-gray-700">
                        <span className="text-2xl">{achievement.achievement?.icon || '🏆'}</span>
                        <span className="font-semibold">{achievement.achievement?.name}</span>
                        <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                          +{achievement.achievement?.points}pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-3xl font-bold text-purple-600">{result.score}</div>
                    <div className="text-sm text-gray-600">Pontos</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-pink-600">{result.leads}</div>
                    <div className="text-sm text-gray-600">Leads</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-600">{result.distance}m</div>
                    <div className="text-sm text-gray-600">Distância</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center flex-wrap">
                <Link
                  href="/aplicativo/games/leadcity/stats"
                  className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  📊 Ver Estatísticas
                </Link>
                <button
                  onClick={() => window.location.href = '/aplicativo/ia-gamificacao'}
                  className="rounded-full bg-white px-6 py-3 text-gray-700 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 ring-1 ring-gray-200"
                >
                  🌍 Ranking Global
                </button>
                <button
                  onClick={playAgain}
                  className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  🎮 Jogar Novamente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
