// DTO unificado de alimento — formato único do sistema.
// TACO e Open Food Facts convergem para cá (ver mappers.js).
// Valores sempre por 100 g (porcao_referencia_g = 100).

export const FONTES = {
  TACO: 'TACO',
  OFF: 'OPEN_FOOD_FACTS',
  LOCAL: 'LOCAL', // banco local / cadastrado pelo usuário
}

const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

// Cria um alimento padronizado. Campos ausentes/nulos viram 0 (nunca NaN).
export function createFood({
  id,
  nome,
  marca = null,
  codigo_barras = null,
  fonte,
  porcao_referencia_g = 100,
  calorias_100g = 0,
  proteinas_100g = 0,
  carboidratos_100g = 0,
  gorduras_100g = 0,
  fibras_100g = 0,
  categoria = null,
  nutri_score = null,
  nova_group = null,
} = {}) {
  if (!nome || !fonte) throw new Error('FOOD_INVALIDO: nome e fonte são obrigatórios')
  const ref = Number(porcao_referencia_g) > 0 ? Number(porcao_referencia_g) : 100
  return {
    id: id ?? gerarIdAlimento(fonte, codigo_barras ?? nome),
    nome: String(nome),
    marca: marca ? String(marca) : null,
    codigo_barras: codigo_barras ? String(codigo_barras) : null,
    fonte,
    porcao_referencia_g: ref,
    calorias_100g: num(calorias_100g),
    proteinas_100g: num(proteinas_100g),
    carboidratos_100g: num(carboidratos_100g),
    gorduras_100g: num(gorduras_100g),
    fibras_100g: num(fibras_100g),
    categoria,
    nutri_score,
    nova_group,
  }
}

export function gerarIdAlimento(fonte, chave) {
  const slug = String(chave ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'item'
  return `${String(fonte).toLowerCase()}:${slug}`
}

// Adaptador: DTO → item de refeição do app (formato usado pela Comida +
// scaleFood: { name, kcal, prot, carb, fat, unit, baseGrams }).
export function foodParaItemRefeicao(food) {
  const sufixo = food.fonte === FONTES.TACO ? '(TACO)' : food.fonte === FONTES.OFF ? '(OFF)' : '(local)'
  const unit = food.fonte === FONTES.TACO
    ? `${food.porcao_referencia_g}g (TACO)`
    : food.fonte === FONTES.OFF
      ? `${food.porcao_referencia_g}g (Open Food Facts)`
      : `${food.porcao_referencia_g}g`;
  return {
    name: `${food.nome} ${sufixo}`,
    kcal: food.calorias_100g,
    prot: food.proteinas_100g,
    carb: food.carboidratos_100g,
    fat: food.gorduras_100g,
    unit,
    baseGrams: food.porcao_referencia_g,
    foodId: food.id,
    fonte: food.fonte,
  }
}
