// Shared types for gamification games

export type Difficulty = 'facil' | 'medio' | 'dificil' | 'expert';

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
};

export type GameScore = {
  gameId: string;
  score: number;
  timestamp: Date;
  difficulty?: Difficulty;
  metadata?: Record<string, unknown>;
};

export type PlayerStats = {
  totalPoints: number;
  gamesPlayed: number;
  badges: Badge[];
  streaks: Record<string, number>;
  highScores: Record<string, number>;
};

// Puzzle Game Types
export type PuzzlePiece = {
  id: number;
  correctPosition: number;
  currentPosition: number;
  image: string;
};

export type PuzzleConfig = {
  difficulty: Difficulty;
  pieces: number;
  timeLimit: number;
  basePoints: number;
};

// Board Game Types
export type PropertyTile = {
  id: number;
  name: string;
  city: string;
  price: number;
  owner: string | null;
  commission: number;
};

export type BoardPlayer = {
  id: string;
  name: string;
  money: number;
  position: number;
  properties: number[];
  color: string;
};

export type CardType = 'sorte' | 'reves' | 'coaching';

export type GameCard = {
  type: CardType;
  title: string;
  description: string;
  effect: (player: BoardPlayer) => BoardPlayer;
};

// Runner Game Types
export type RunnerItem = {
  id: string;
  type: 'lead-qualificado' | 'lead-morno' | 'contrato' | 'powerup' | 'obstacle';
  x: number;
  y: number;
  points: number;
  width: number;
  height: number;
};

export type RunnerPlayer = {
  x: number;
  y: number;
  velocityY: number;
  isJumping: boolean;
};

// Quiz Game Types
export type QuizCategory = 'legislacao' | 'vendas' | 'tecnicas' | 'mercado';

export type QuizQuestion = {
  id: string;
  category: QuizCategory;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
};

export type QuizHelp = '50-50' | 'extra-time';

export type QuizResult = {
  correctAnswers: number;
  totalQuestions: number;
  points: number;
  timeTaken: number;
  date: Date;
};
