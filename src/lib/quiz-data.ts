// Quiz question bank for Imobiliário IQ

import type { QuizQuestion } from '@/types/games';

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // Legislação
  {
    id: 'leg-1',
    category: 'legislacao',
    question: 'Qual o prazo mínimo de contrato de arrendamento em Portugal?',
    options: ['6 meses', '1 ano', '2 anos', '5 anos'],
    correctAnswer: 2,
    explanation: 'O prazo mínimo é de 2 anos para contratos de arrendamento habitacional.',
  },
  {
    id: 'leg-2',
    category: 'legislacao',
    question: 'O que significa IMT?',
    options: ['Imposto Municipal sobre Transações', 'Imposto Municipal sobre Transmissões', 'Imposto sobre Móveis e Terrenos', 'Imposto Municipal de Transferências'],
    correctAnswer: 1,
    explanation: 'IMT significa Imposto Municipal sobre Transmissões Onerosas de Imóveis.',
  },
  {
    id: 'leg-3',
    category: 'legislacao',
    question: 'Qual o prazo para pagamento do IMT após a escritura?',
    options: ['15 dias', '30 dias', '60 dias', '90 dias'],
    correctAnswer: 1,
    explanation: 'O IMT deve ser pago em até 30 dias após a escritura.',
  },
  {
    id: 'leg-4',
    category: 'legislacao',
    question: 'O que é o Certificado Energético?',
    options: ['Certificado de consumo de água', 'Certificado de eficiência energética do imóvel', 'Certificado de energia solar', 'Certificado de gás'],
    correctAnswer: 1,
    explanation: 'É um documento que classifica a eficiência energética de um imóvel de A+ a F.',
  },
  {
    id: 'leg-5',
    category: 'legislacao',
    question: 'Quantos anos é válido o Certificado Energético?',
    options: ['5 anos', '10 anos', '15 anos', '20 anos'],
    correctAnswer: 1,
    explanation: 'O Certificado Energético tem validade de 10 anos.',
  },

  // Mercado
  {
    id: 'mer-1',
    category: 'mercado',
    question: 'Qual a cidade com preço/m² mais alto em Portugal?',
    options: ['Porto', 'Lisboa', 'Cascais', 'Albufeira'],
    correctAnswer: 1,
    explanation: 'Lisboa tem os preços por metro quadrado mais altos de Portugal.',
  },
  {
    id: 'mer-2',
    category: 'mercado',
    question: 'Qual o portal imobiliário mais usado em Portugal?',
    options: ['OLX', 'Idealista', 'Imovirtual', 'Casa Sapo'],
    correctAnswer: 1,
    explanation: 'O Idealista é líder de mercado em Portugal.',
  },
  {
    id: 'mer-3',
    category: 'mercado',
    question: 'Qual região teve maior valorização imobiliária em 2024?',
    options: ['Algarve', 'Grande Lisboa', 'Grande Porto', 'Alentejo'],
    correctAnswer: 0,
    explanation: 'O Algarve teve valorização significativa devido ao turismo e procura internacional.',
  },
  {
    id: 'mer-4',
    category: 'mercado',
    question: 'Qual a taxa de IVA para obras de remodelação?',
    options: ['6%', '13%', '23%', '30%'],
    correctAnswer: 1,
    explanation: 'A taxa reduzida de IVA para obras de remodelação é 13%.',
  },
  {
    id: 'mer-5',
    category: 'mercado',
    question: 'Qual o prazo médio de venda de um imóvel em Portugal?',
    options: ['1-2 meses', '3-4 meses', '6-8 meses', '12 meses'],
    correctAnswer: 1,
    explanation: 'O prazo médio é de 3-4 meses, variando conforme localização e preço.',
  },

  // Vendas
  {
    id: 'ven-1',
    category: 'vendas',
    question: 'Qual a comissão média de um consultor imobiliário?',
    options: ['1-2%', '3-5%', '6-8%', '10-12%'],
    correctAnswer: 1,
    explanation: 'A comissão média varia entre 3-5% do valor da transação.',
  },
  {
    id: 'ven-2',
    category: 'vendas',
    question: 'O que é um lead qualificado?',
    options: ['Qualquer pessoa interessada', 'Cliente com capacidade financeira verificada', 'Cliente que respondeu email', 'Cliente que visitou site'],
    correctAnswer: 1,
    explanation: 'Lead qualificado é aquele com real capacidade e interesse de compra.',
  },
  {
    id: 'ven-3',
    category: 'vendas',
    question: 'Qual a melhor hora para ligar para um lead?',
    options: ['8h-9h', '12h-13h', '18h-20h', '21h-22h'],
    correctAnswer: 2,
    explanation: 'O horário de 18h-20h tem maior taxa de atendimento.',
  },
  {
    id: 'ven-4',
    category: 'vendas',
    question: 'Quantas visitas em média até fechar negócio?',
    options: ['1-2 visitas', '3-5 visitas', '6-10 visitas', 'Mais de 10'],
    correctAnswer: 1,
    explanation: 'Em média são necessárias 3-5 visitas até fechar um negócio.',
  },
  {
    id: 'ven-5',
    category: 'vendas',
    question: 'O que é follow-up?',
    options: ['Primeira abordagem', 'Acompanhamento pós-contacto', 'Fechamento de venda', 'Análise de mercado'],
    correctAnswer: 1,
    explanation: 'Follow-up é o acompanhamento sistemático após o contacto inicial.',
  },

  // Técnicas
  {
    id: 'tec-1',
    category: 'tecnicas',
    question: 'Qual técnica PNL para criar rapport?',
    options: ['Espelhamento', 'Confronto', 'Monólogo', 'Silêncio absoluto'],
    correctAnswer: 0,
    explanation: 'Espelhamento (mirroring) cria conexão inconsciente com o cliente.',
  },
  {
    id: 'tec-2',
    category: 'tecnicas',
    question: 'O que é a técnica SPIN Selling?',
    options: ['Vender rapidamente', 'Fazer perguntas estratégicas', 'Dar descontos', 'Pressionar cliente'],
    correctAnswer: 1,
    explanation: 'SPIN usa perguntas: Situação, Problema, Implicação, Necessidade.',
  },
  {
    id: 'tec-3',
    category: 'tecnicas',
    question: 'O que significa CNV?',
    options: ['Comunicação Não Violenta', 'Contrato de Não Venda', 'Centro Nacional de Vendas', 'Conversa Natural com o Vendedor'],
    correctAnswer: 0,
    explanation: 'CNV é Comunicação Não Violenta, técnica para empatia e conexão.',
  },
  {
    id: 'tec-4',
    category: 'tecnicas',
    question: 'Qual perfil DISC é mais analítico?',
    options: ['Dominante', 'Influente', 'Estável', 'Consciente'],
    correctAnswer: 3,
    explanation: 'O perfil C (Consciente) é o mais analítico e detalhista.',
  },
  {
    id: 'tec-5',
    category: 'tecnicas',
    question: 'O que é objeção de preço?',
    options: ['Cliente sem dinheiro', 'Cliente não vê valor', 'Cliente negociando', 'Todas as anteriores'],
    correctAnswer: 3,
    explanation: 'Objeção de preço pode ter várias origens e deve ser investigada.',
  },

  // Additional questions
  {
    id: 'leg-6',
    category: 'legislacao',
    question: 'Qual documento é obrigatório para vender um imóvel?',
    options: ['Caderneta Predial', 'Certidão Permanente', 'Ambos', 'Nenhum'],
    correctAnswer: 2,
    explanation: 'São necessários tanto a Caderneta Predial quanto a Certidão Permanente.',
  },
  {
    id: 'mer-6',
    category: 'mercado',
    question: 'Qual o valor médio de um T2 em Lisboa (2025)?',
    options: ['150.000€', '250.000€', '350.000€', '450.000€'],
    correctAnswer: 2,
    explanation: 'O valor médio de um T2 em Lisboa ronda os 350.000€.',
  },
  {
    id: 'ven-6',
    category: 'vendas',
    question: 'Qual a taxa de conversão média de leads?',
    options: ['1-2%', '5-10%', '15-20%', '25-30%'],
    correctAnswer: 1,
    explanation: 'A taxa de conversão média no imobiliário é de 5-10%.',
  },
  {
    id: 'tec-6',
    category: 'tecnicas',
    question: 'O que é upselling?',
    options: ['Baixar preço', 'Oferecer produto superior', 'Cancelar venda', 'Trocar produto'],
    correctAnswer: 1,
    explanation: 'Upselling é oferecer um produto ou serviço de valor superior.',
  },
  {
    id: 'leg-7',
    category: 'legislacao',
    question: 'O que é o IMI?',
    options: ['Imposto Municipal sobre Imóveis', 'Imposto sobre Móveis', 'Imposto de Mais-valia Imobiliária', 'Imposto Municipal de Investimento'],
    correctAnswer: 0,
    explanation: 'IMI é o Imposto Municipal sobre Imóveis, pago anualmente.',
  },
  {
    id: 'mer-7',
    category: 'mercado',
    question: 'Qual tipologia é mais procurada em Portugal?',
    options: ['T0', 'T1', 'T2', 'T3'],
    correctAnswer: 2,
    explanation: 'T2 é a tipologia mais procurada no mercado português.',
  },
];

export function getRandomQuestions(count: number = 10): QuizQuestion[] {
  const shuffled = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getQuestionsByCategory(category: string, count: number = 5): QuizQuestion[] {
  const filtered = QUIZ_QUESTIONS.filter(q => q.category === category);
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
