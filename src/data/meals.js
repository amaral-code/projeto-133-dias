// Tabela revisada (referência: TACO/Unicamp + USDA).
// Valores por porção real do plano. Totais do dia: ~1687 kcal | P ~163g | C ~168g | G ~42g
export const MEALS = [
  { id: 'pre-treino', title: 'Pré-Treino', time: '06:30', items: [
    { name: 'Banana Prata', qty: 1, unit: 'unid média (80g)', kcal: 72, prot: 1.0, carb: 18.6, fat: 0.2 },
    { name: 'Café Preto sem açúcar', qty: 1, unit: 'xícara (200ml)', kcal: 2, prot: 0.3, carb: 0.4, fat: 0 }
  ]},
  { id: 'cafe', title: 'Café da Manhã', time: '08:30', items: [
    { name: 'Ovos Mexidos (sem óleo)', qty: 3, unit: 'unidades (~150g)', kcal: 216, prot: 19, carb: 1.8, fat: 15 },
    { name: 'Pão Integral 100%', qty: 2, unit: 'fatias (50g)', kcal: 124, prot: 5.4, carb: 23, fat: 1.6 },
    { name: 'Queijo Cottage', qty: 1, unit: 'colher sopa (30g)', kcal: 30, prot: 3.8, carb: 1.0, fat: 1.2 }
  ]},
  { id: 'almoco', title: 'Almoço', time: '12:45', items: [
    { name: 'Peito de Frango Grelhado', qty: 160, unit: 'gramas (cozido)', kcal: 262, prot: 49.6, carb: 0, fat: 5.7 },
    { name: 'Arroz Branco Cozido', qty: 150, unit: 'gramas', kcal: 192, prot: 3.8, carb: 42.2, fat: 0.4 },
    { name: 'Feijão Carioca Cozido', qty: 80, unit: 'gramas', kcal: 61, prot: 3.9, carb: 11.1, fat: 0.4 },
    { name: 'Salada Folhas + Tomate', qty: 1, unit: 'prato (~100g)', kcal: 28, prot: 1.2, carb: 5.6, fat: 0.2 }
  ]},
  { id: 'lanche', title: 'Lanche da Tarde', time: '16:30', items: [
    { name: 'Whey Protein Isolado', qty: 1, unit: 'scoop (30g)', kcal: 116, prot: 24, carb: 2, fat: 1 },
    { name: 'Maçã Fuji', qty: 1, unit: 'unidade média (130g)', kcal: 68, prot: 0.4, carb: 18, fat: 0.2 },
    { name: 'Pasta de Amendoim Integral', qty: 15, unit: 'gramas (1 col. sopa)', kcal: 89, prot: 3.8, carb: 3.1, fat: 7.5 }
  ]},
  { id: 'jantar', title: 'Jantar', time: '20:30', items: [
    { name: 'Patinho Moído Grelhado', qty: 150, unit: 'gramas (cozido)', kcal: 238, prot: 40.5, carb: 0, fat: 7.5 },
    { name: 'Batata Inglesa Assada', qty: 180, unit: 'gramas', kcal: 154, prot: 3.6, carb: 34.5, fat: 0.2 },
    { name: 'Brócolis ao Vapor', qty: 100, unit: 'gramas', kcal: 35, prot: 2.8, carb: 6.6, fat: 0.4 }
  ]}
]
