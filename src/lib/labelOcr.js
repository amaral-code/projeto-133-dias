// OCR de rótulo BR — extrai medida + valores nutricionais do texto do Tesseract.
// Padrões ANVISA (RDC 429/2020): "Porção de Xg", "Valor energético X kcal",
// "Proteínas X g", "Carboidratos X g", "Gorduras totais X g", "Fibra alimentar X g".
// Tudo tolerante a OCR ruim: vírgula/ponto, "g/ml", "kcal/kJ", acentos.

const num = (s) => {
  if (s == null) return null
  const n = Number(String(s).replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : null
}

const norm = (t) =>
  String(t ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

function firstMatch(text, patterns) {
  for (const re of patterns) {
    const m = text.match(re)
    if (m) {
      const v = num(m[1] ?? m[2])
      if (v != null) return v
    }
  }
  return null
}

export function kjToKcal(kj) {
  const n = Number(kj)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n / 4.184)
}

export function parseLabelText(rawText = '') {
  const t = norm(rawText)
  const flat = t.replace(/\s+/g, ' ')

  // Porção: "porcao de 30g", "porcao 40 g", "por porcao de 200 ml"
  const porcaoG = firstMatch(flat, [
    /porc[aã]o\s*(?:de|por)?\s*(\d+(?:[.,]\d+)?)\s*g/,
    /porc[aã]o\s*(?:de|por)?\s*(\d+(?:[.,]\d+)?)\s*ml/,
    /por\s*porc[aã]o\s*(\d+(?:[.,]\d+)?)\s*g/,
  ])

  // Energia: prefere kcal; cai p/ kJ convertido
  let kcal = firstMatch(flat, [
    /valor\s*energetico[^0-9]*(\d+(?:[.,]\d+)?)\s*kcal/,
    /energia[^0-9]*(\d+(?:[.,]\d+)?)\s*kcal/,
    /(\d+(?:[.,]\d+)?)\s*kcal/,
  ])
  if (kcal == null || !Number.isFinite(kcal)) {
    const kj = firstMatch(flat, [/(\d+(?:[.,]\d+)?)\s*kj/])
    kcal = kj != null ? kjToKcal(kj) : null
  }

  const prot = firstMatch(flat, [
    /proteinas?[^0-9]*(\d+(?:[.,]\d+)?)\s*g/,
  ])
  const carb = firstMatch(flat, [
    /carboidratos?(?:\s*totais)?[^0-9]*(\d+(?:[.,]\d+)?)\s*g/,
    /carbo[^0-9]*(\d+(?:[.,]\d+)?)\s*g/,
  ])
  // Gorduras totais primeiro; se só houver saturada/trans, usa o 1º "gordura Xg"
  const fat =
    firstMatch(flat, [/gorduras?\s*totais[^0-9]*(\d+(?:[.,]\d+)?)\s*g/]) ??
    firstMatch(flat, [/gordura[^0-9]*(\d+(?:[.,]\d+)?)\s*g/])
  const fibra = firstMatch(flat, [
    /fibra(?:s)?(?:\s*alimentar)?[^0-9]*(\d+(?:[.,]\d+)?)\s*g/,
  ])

  return { porcaoG, kcal, prot, carb, fat, fibra }
}

export function labelConfidence(parsed) {
  let score = 0
  const ok = (v) => Number.isFinite(Number(v)) && Number(v) > 0
  if (ok(parsed?.kcal)) score += 2
  if (ok(parsed?.porcaoG)) score += 1
  if (ok(parsed?.prot)) score += 1
  if (ok(parsed?.carb)) score += 1
  if (ok(parsed?.fat)) score += 1
  return score // 0..6
}
