// Board game data for Imobiliária Portugal

import type { PropertyTile, GameCard } from '@/types/games';

export const BOARD_PROPERTIES: PropertyTile[] = [
  { id: 0, name: 'Início', city: 'Início', price: 0, owner: null, commission: 0 },
  { id: 1, name: 'Alfama', city: 'Lisboa', price: 350000, owner: null, commission: 35000 },
  { id: 2, name: 'Sorte', city: 'Sorte', price: 0, owner: null, commission: 0 },
  { id: 3, name: 'Boavista', city: 'Porto', price: 280000, owner: null, commission: 28000 },
  { id: 4, name: 'Imposto', city: 'Imposto', price: 0, owner: null, commission: 10000 },
  { id: 5, name: 'Cascais', city: 'Cascais', price: 420000, owner: null, commission: 42000 },
  { id: 6, name: 'Coaching IA', city: 'Coaching', price: 0, owner: null, commission: 0 },
  { id: 7, name: 'Braga Centro', city: 'Braga', price: 200000, owner: null, commission: 20000 },
  { id: 8, name: 'Revés', city: 'Revés', price: 0, owner: null, commission: 0 },
  { id: 9, name: 'Coimbra Alta', city: 'Coimbra', price: 180000, owner: null, commission: 18000 },
  { id: 10, name: 'Visita Grátis', city: 'Especial', price: 0, owner: null, commission: 0 },
  { id: 11, name: 'Albufeira', city: 'Algarve', price: 380000, owner: null, commission: 38000 },
  { id: 12, name: 'Sorte', city: 'Sorte', price: 0, owner: null, commission: 0 },
  { id: 13, name: 'Matosinhos', city: 'Porto', price: 260000, owner: null, commission: 26000 },
  { id: 14, name: 'Coaching IA', city: 'Coaching', price: 0, owner: null, commission: 0 },
  { id: 15, name: 'Parque Nações', city: 'Lisboa', price: 400000, owner: null, commission: 40000 },
  { id: 16, name: 'Imposto', city: 'Imposto', price: 0, owner: null, commission: 15000 },
  { id: 17, name: 'Faro Centro', city: 'Faro', price: 220000, owner: null, commission: 22000 },
  { id: 18, name: 'Revés', city: 'Revés', price: 0, owner: null, commission: 0 },
  { id: 19, name: 'Funchal', city: 'Madeira', price: 320000, owner: null, commission: 32000 },
  { id: 20, name: 'Pausa', city: 'Especial', price: 0, owner: null, commission: 0 },
  { id: 21, name: 'Aveiro Ria', city: 'Aveiro', price: 190000, owner: null, commission: 19000 },
  { id: 22, name: 'Sorte', city: 'Sorte', price: 0, owner: null, commission: 0 },
  { id: 23, name: 'Setúbal', city: 'Setúbal', price: 170000, owner: null, commission: 17000 },
  { id: 24, name: 'Coaching IA', city: 'Coaching', price: 0, owner: null, commission: 0 },
  { id: 25, name: 'Estoril', city: 'Cascais', price: 480000, owner: null, commission: 48000 },
  { id: 26, name: 'Imposto', city: 'Imposto', price: 0, owner: null, commission: 20000 },
  { id: 27, name: 'Guimarães', city: 'Braga', price: 160000, owner: null, commission: 16000 },
  { id: 28, name: 'Revés', city: 'Revés', price: 0, owner: null, commission: 0 },
  { id: 29, name: 'Ponta Delgada', city: 'Açores', price: 210000, owner: null, commission: 21000 },
  { id: 30, name: 'Visita Forçada', city: 'Especial', price: 0, owner: null, commission: 0 },
  { id: 31, name: 'Baixa Porto', city: 'Porto', price: 390000, owner: null, commission: 39000 },
  { id: 32, name: 'Sorte', city: 'Sorte', price: 0, owner: null, commission: 0 },
  { id: 33, name: 'Évora', city: 'Alentejo', price: 150000, owner: null, commission: 15000 },
  { id: 34, name: 'Coaching IA', city: 'Coaching', price: 0, owner: null, commission: 0 },
  { id: 35, name: 'Chiado', city: 'Lisboa', price: 520000, owner: null, commission: 52000 },
  { id: 36, name: 'Imposto Luxo', city: 'Imposto', price: 0, owner: null, commission: 30000 },
  { id: 37, name: 'Portimão', city: 'Algarve', price: 290000, owner: null, commission: 29000 },
  { id: 38, name: 'Revés', city: 'Revés', price: 0, owner: null, commission: 0 },
  { id: 39, name: 'Avenida Liberdade', city: 'Lisboa', price: 600000, owner: null, commission: 60000 },
];

export const LUCK_CARDS: GameCard[] = [
  {
    type: 'sorte',
    title: 'Venda Fechada!',
    description: 'Receba €50.000',
    effect: (player) => ({ ...player, money: player.money + 50000 }),
  },
  {
    type: 'sorte',
    title: 'Cliente Internacional',
    description: 'Receba €80.000',
    effect: (player) => ({ ...player, money: player.money + 80000 }),
  },
  {
    type: 'sorte',
    title: 'Bônus de Performance',
    description: 'Receba €30.000',
    effect: (player) => ({ ...player, money: player.money + 30000 }),
  },
  {
    type: 'sorte',
    title: 'Lead Qualificado',
    description: 'Avance 3 casas',
    effect: (player) => ({ ...player, position: (player.position + 3) % 40 }),
  },
  {
    type: 'sorte',
    title: 'Indicação Premium',
    description: 'Receba €40.000',
    effect: (player) => ({ ...player, money: player.money + 40000 }),
  },
];

export const SETBACK_CARDS: GameCard[] = [
  {
    type: 'reves',
    title: 'IMT Atrasado',
    description: 'Pague €10.000',
    effect: (player) => ({ ...player, money: player.money - 10000 }),
  },
  {
    type: 'reves',
    title: 'Cliente Desistiu',
    description: 'Pague €15.000',
    effect: (player) => ({ ...player, money: player.money - 15000 }),
  },
  {
    type: 'reves',
    title: 'Processo Legal',
    description: 'Pague €20.000',
    effect: (player) => ({ ...player, money: player.money - 20000 }),
  },
  {
    type: 'reves',
    title: 'Concorrência Agressiva',
    description: 'Recue 3 casas',
    effect: (player) => ({ ...player, position: (player.position - 3 + 40) % 40 }),
  },
  {
    type: 'reves',
    title: 'Imposto Inesperado',
    description: 'Pague €25.000',
    effect: (player) => ({ ...player, money: player.money - 25000 }),
  },
];

export const COACHING_QUESTIONS = [
  {
    question: 'Qual a comissão média de uma venda?',
    options: ['2%', '5%', '10%'],
    correct: 1,
  },
  {
    question: 'O que é IMT?',
    options: ['Imposto Municipal de Transmissões', 'Imposto sobre Móveis', 'Imposto de Transação'],
    correct: 0,
  },
  {
    question: 'Prazo mínimo de arrendamento?',
    options: ['1 ano', '2 anos', '5 anos'],
    correct: 1,
  },
  {
    question: 'O que é rapport?',
    options: ['Relatório', 'Conexão com cliente', 'Tipo de contrato'],
    correct: 1,
  },
];

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function getRandomCard(type: 'sorte' | 'reves'): GameCard {
  const cards = type === 'sorte' ? LUCK_CARDS : SETBACK_CARDS;
  return cards[Math.floor(Math.random() * cards.length)];
}

export function getRandomCoachingQuestion() {
  return COACHING_QUESTIONS[Math.floor(Math.random() * COACHING_QUESTIONS.length)];
}
