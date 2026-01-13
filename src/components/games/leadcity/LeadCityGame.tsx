'use client';

import { useEffect, useRef, useState } from 'react';
import socketIOClient from 'socket.io-client';
import { createClient } from '@/lib/supabase/client';

export function LeadCityGame() {
  const gameRef = useRef<any | null>(null);
  const socketRef = useRef<any | null>(null);
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'finished'>('lobby');
  const [player, setPlayer] = useState<{ id: string; username: string; avatar: string } | null>(null);
  const [result, setResult] = useState<{ score: number; leads: number; distance: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        
        setPlayer({
          id: user.id,
          username: profile?.full_name || 'Consultor',
          avatar: '🏃'
        });
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
      socketRef.current = socketIOClient({
        path: '/api/socket',
      });

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
    if (!player || player.id.startsWith('guest-')) return;

    try {
      const supabase = createClient();
      
      // Get or create leadcity_player
      let { data: lcPlayer } = await supabase
        .from('leadcity_players')
        .select('*')
        .eq('user_id', player.id)
        .single();
      
      if (!lcPlayer) {
        const { data: newPlayer } = await supabase
          .from('leadcity_players')
          .insert({
            user_id: player.id,
            username: player.username,
            avatar: player.avatar
          })
          .select()
          .single();
        
        lcPlayer = newPlayer;
      }

      if (lcPlayer) {
        // Update player stats
        await supabase
          .from('leadcity_players')
          .update({
            total_matches: (lcPlayer.total_matches || 0) + 1,
            total_score: (lcPlayer.total_score || 0) + result.score,
            total_leads: (lcPlayer.total_leads || 0) + result.leads,
            best_score: Math.max(lcPlayer.best_score || 0, result.score),
            updated_at: new Date().toISOString()
          })
          .eq('id', lcPlayer.id);
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

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => window.location.href = '/aplicativo/ia-gamificacao'}
                  className="rounded-full bg-white px-6 py-3 text-gray-700 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 ring-1 ring-gray-200"
                >
                  Ver Ranking Global
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
