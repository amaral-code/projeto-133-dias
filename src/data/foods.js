// Tabela revisada (TACO/USDA). `baseGrams` = gramas às quais os valores se referem
// (permite lançar qualquer quantidade: o app escala kcal e macros sozinho).
export const EXTRA_FOODS = [
  { name: 'Arroz Branco Cozido', kcal: 128, prot: 2.5, carb: 28, fat: 0.2, unit: '100g', baseGrams: 100 },
  { name: 'Peito de Frango Grelhado', kcal: 159, prot: 31, carb: 0, fat: 3.4, unit: '100g', baseGrams: 100 },
  { name: 'Whey Protein Isolado', kcal: 116, prot: 24, carb: 2, fat: 1, unit: '30g scoop', baseGrams: 30 },
  { name: 'Ovo Inteiro Cozido', kcal: 72, prot: 6.3, carb: 0.6, fat: 5, unit: '1 unid (~50g)', baseGrams: 50 },
  { name: 'Batata Doce Cozida', kcal: 86, prot: 1.6, carb: 20.1, fat: 0.1, unit: '100g', baseGrams: 100 },
  { name: 'Aveia em Flocos', kcal: 117, prot: 5, carb: 20, fat: 2.1, unit: '30g (3 col. sopa)', baseGrams: 30 },
  { name: 'Azeite de Oliva', kcal: 99, prot: 0, carb: 0, fat: 11, unit: '1 col. sopa (12ml)', baseGrams: 12 },
  { name: 'Patinho Moído Grelhado', kcal: 159, prot: 27, carb: 0, fat: 5, unit: '100g', baseGrams: 100 },
  { name: 'Tilápia Grelhada', kcal: 128, prot: 26, carb: 0, fat: 2.7, unit: '100g', baseGrams: 100 },
  { name: 'Atum em Água (lata)', kcal: 108, prot: 24, carb: 0, fat: 1, unit: '100g drenado', baseGrams: 100 },
  { name: 'Feijão Carioca Cozido', kcal: 76, prot: 4.8, carb: 13.9, fat: 0.5, unit: '100g', baseGrams: 100 },
  { name: 'Macarrão Integral Cozido', kcal: 124, prot: 4.5, carb: 25, fat: 0.6, unit: '100g', baseGrams: 100 },
  { name: 'Tapioca (goma)', kcal: 68, prot: 0.1, carb: 17.3, fat: 0, unit: '20g (1 disco fino)', baseGrams: 20 },
  { name: 'Banana Prata', kcal: 90, prot: 1.3, carb: 23.2, fat: 0.3, unit: '100g', baseGrams: 100 },
  { name: 'Maçã Fuji', kcal: 52, prot: 0.3, carb: 13.8, fat: 0.2, unit: '100g', baseGrams: 100 },
  { name: 'Leite Desnatado', kcal: 35, prot: 3.4, carb: 5, fat: 0.1, unit: '100ml', baseGrams: 100 },
  { name: 'Iogurte Natural Desnatado', kcal: 41, prot: 3.7, carb: 5.8, fat: 0.2, unit: '100g', baseGrams: 100 },
  { name: 'Queijo Cottage', kcal: 98, prot: 12.6, carb: 3.2, fat: 4, unit: '100g', baseGrams: 100 }
]
