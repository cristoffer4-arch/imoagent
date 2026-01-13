'use client';

import { useState, useCallback } from 'react';
import type { BoardPlayer, PropertyTile } from '@/types/games';
import { BOARD_PROPERTIES, rollDice, getRandomCard, getRandomCoachingQuestion } from '@/lib/board-game-data';

type BoardGameProps = {
  onGameEnd: (winner: BoardPlayer, turns: number) => void;
};

export function BoardGame({ onGameEnd }: BoardGameProps) {
  const [properties, setProperties] = useState<PropertyTile[]>(BOARD_PROPERTIES);
  const [players, setPlayers] = useState<BoardPlayer[]>([
    { id: 'player', name: 'Você', money: 500000, position: 0, properties: [], color: '#8b5cf6' },
    { id: 'ai', name: 'IA', money: 500000, position: 0, properties: [], color: '#ec4899' },
  ]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [gameLog, setGameLog] = useState<string[]>(['Jogo iniciado! Boa sorte!']);
  const [turns, setTurns] = useState(0);
  const [showCard, setShowCard] = useState<any>(null);
  const [showCoaching, setShowCoaching] = useState<any>(null);

  const currentPlayer = players[currentPlayerIndex];

  const addLog = useCallback((message: string) => {
    setGameLog(prev => [...prev.slice(-4), message]);
  }, []);

  const handleRollDice = () => {
    const dice = rollDice();
    setDiceValue(dice);

    // Move player
    const newPosition = (currentPlayer.position + dice) % 40;
    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerIndex] = { ...currentPlayer, position: newPosition };
    setPlayers(updatedPlayers);

    addLog(`${currentPlayer.name} tirou ${dice} e foi para ${properties[newPosition].name}`);

    // Handle tile action after a delay
    setTimeout(() => {
      handleTileAction(newPosition, updatedPlayers[currentPlayerIndex]);
    }, 1000);
  };

  const handleTileAction = (position: number, player: BoardPlayer) => {
    const tile = properties[position];

    if (tile.city === 'Sorte') {
      const card = getRandomCard('sorte');
      setShowCard(card);
      addLog(`${player.name} tirou carta: ${card.title}`);
    } else if (tile.city === 'Revés') {
      const card = getRandomCard('reves');
      setShowCard(card);
      addLog(`${player.name} tirou carta: ${card.title}`);
    } else if (tile.city === 'Coaching') {
      const question = getRandomCoachingQuestion();
      setShowCoaching({ ...question, playerId: player.id });
      addLog(`${player.name} entrou no Coaching IA`);
    } else if (tile.city === 'Imposto') {
      const updatedPlayers = [...players];
      const playerIndex = updatedPlayers.findIndex(p => p.id === player.id);
      updatedPlayers[playerIndex].money -= tile.commission;
      setPlayers(updatedPlayers);
      addLog(`${player.name} pagou imposto de €${tile.commission.toLocaleString()}`);
      nextTurn();
    } else if (tile.price > 0) {
      // Property tile
      if (tile.owner === null && player.money >= tile.price) {
        // Can buy
        setTimeout(() => {
          if (player.id === 'ai' || confirm(`Comprar ${tile.name} por €${tile.price.toLocaleString()}?`)) {
            buyProperty(position, player.id);
          } else {
            nextTurn();
          }
        }, 500);
      } else if (tile.owner && tile.owner !== player.id) {
        // Pay rent
        const updatedPlayers = [...players];
        const playerIndex = updatedPlayers.findIndex(p => p.id === player.id);
        const ownerIndex = updatedPlayers.findIndex(p => p.id === tile.owner);
        
        updatedPlayers[playerIndex].money -= tile.commission;
        updatedPlayers[ownerIndex].money += tile.commission;
        setPlayers(updatedPlayers);
        addLog(`${player.name} pagou €${tile.commission.toLocaleString()} para ${updatedPlayers[ownerIndex].name}`);
        nextTurn();
      } else {
        nextTurn();
      }
    } else {
      nextTurn();
    }

    // Check win condition
    setTimeout(() => {
      checkWinCondition();
    }, 1500);
  };

  const buyProperty = (position: number, playerId: string) => {
    const updatedProperties = [...properties];
    const updatedPlayers = [...players];
    
    const playerIndex = updatedPlayers.findIndex(p => p.id === playerId);
    const property = updatedProperties[position];
    
    updatedPlayers[playerIndex].money -= property.price;
    updatedPlayers[playerIndex].properties.push(position);
    updatedProperties[position].owner = playerId;
    
    setProperties(updatedProperties);
    setPlayers(updatedPlayers);
    addLog(`${updatedPlayers[playerIndex].name} comprou ${property.name}`);
    
    nextTurn();
  };

  const handleCardClose = (card: any) => {
    const updatedPlayers = [...players];
    const playerIndex = updatedPlayers.findIndex(p => p.id === currentPlayer.id);
    updatedPlayers[playerIndex] = card.effect(updatedPlayers[playerIndex]);
    setPlayers(updatedPlayers);
    setShowCard(null);
    nextTurn();
  };

  const handleCoachingAnswer = (correct: boolean) => {
    const updatedPlayers = [...players];
    const playerIndex = updatedPlayers.findIndex(p => p.id === showCoaching.playerId);
    
    if (correct) {
      updatedPlayers[playerIndex].money += 20000;
      addLog(`${updatedPlayers[playerIndex].name} acertou! +€20.000`);
    } else {
      addLog(`${updatedPlayers[playerIndex].name} errou e perdeu a vez`);
    }
    
    setPlayers(updatedPlayers);
    setShowCoaching(null);
    nextTurn();
  };

  const nextTurn = () => {
    setDiceValue(null);
    setTurns(prev => prev + 1);
    
    const nextIndex = (currentPlayerIndex + 1) % players.length;
    setCurrentPlayerIndex(nextIndex);

    // AI turn
    if (players[nextIndex].id === 'ai') {
      setTimeout(() => {
        handleRollDice();
      }, 1500);
    }
  };

  const checkWinCondition = () => {
    const playerWithNoMoney = players.find(p => p.money < 0);
    if (playerWithNoMoney) {
      const winner = players.find(p => p.id !== playerWithNoMoney.id)!;
      onGameEnd(winner, turns);
    } else if (turns >= 40) {
      const winner = players.reduce((prev, curr) => 
        (curr.money + curr.properties.length * 50000) > (prev.money + prev.properties.length * 50000) ? curr : prev
      );
      onGameEnd(winner, turns);
    }
  };

  return (
    <div className="space-y-6">
      {/* Game Stats */}
      <div className="grid grid-cols-2 gap-4">
        {players.map((player, idx) => (
          <div
            key={player.id}
            className={`rounded-2xl p-4 ${
              idx === currentPlayerIndex ? 'ring-2 ring-purple-500' : 'ring-1 ring-gray-200'
            }`}
            style={{ backgroundColor: `${player.color}20` }}
          >
            <div className="font-bold text-gray-900">{player.name}</div>
            <div className="text-sm text-gray-600">€{player.money.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{player.properties.length} propriedades</div>
          </div>
        ))}
      </div>

      {/* Board (simplified) */}
      <div className="rounded-2xl bg-gradient-to-br from-green-100 to-blue-100 p-6 min-h-[300px] relative">
        <div className="grid grid-cols-10 gap-1">
          {properties.slice(0, 40).map((prop, idx) => {
            const hasPlayer = players.find(p => p.position === idx);
            return (
              <div
                key={idx}
                className={`aspect-square rounded text-xs p-1 flex flex-col justify-between ${
                  prop.owner ? 'bg-gradient-to-br from-purple-400 to-pink-400 text-white' : 'bg-white'
                } ${hasPlayer ? 'ring-2 ring-yellow-400' : ''}`}
                title={prop.name}
              >
                <div className="font-bold truncate">{prop.name.substring(0, 3)}</div>
                {hasPlayer && <div className="text-center">👤</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dice and Actions */}
      <div className="text-center space-y-4">
        {diceValue && (
          <div className="text-6xl animate-bounce">🎲 {diceValue}</div>
        )}
        
        {!diceValue && currentPlayer.id === 'player' && !showCard && !showCoaching && (
          <button
            onClick={handleRollDice}
            className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-8 py-4 text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            🎲 Rolar Dados
          </button>
        )}

        {currentPlayer.id === 'ai' && !diceValue && (
          <div className="text-gray-600">IA está jogando...</div>
        )}
      </div>

      {/* Game Log */}
      <div className="rounded-xl bg-gray-50 p-4 text-sm space-y-1">
        {gameLog.map((log, idx) => (
          <div key={idx} className="text-gray-700">{log}</div>
        ))}
      </div>

      {/* Card Modal */}
      {showCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center space-y-4">
              <div className="text-5xl">{showCard.type === 'sorte' ? '🍀' : '⚠️'}</div>
              <h3 className="text-2xl font-bold text-gray-900">{showCard.title}</h3>
              <p className="text-gray-600">{showCard.description}</p>
              <button
                onClick={() => handleCardClose(showCard)}
                className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coaching Modal */}
      {showCoaching && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="space-y-4">
              <div className="text-center text-4xl">🎓</div>
              <h3 className="text-xl font-bold text-gray-900">{showCoaching.question}</h3>
              <div className="space-y-2">
                {showCoaching.options.map((opt: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleCoachingAnswer(idx === showCoaching.correct)}
                    className="w-full p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-left font-medium transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
