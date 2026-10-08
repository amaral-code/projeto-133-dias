# 🔥 Projeto 133 Dias

App de treino + dieta + evolução — 133 dias, offline-first, instalável no celular (PWA).

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 19 testes (node --test)
npm run build    # gera dist/
```

## O que tem

- **Hoje** — missões diárias, água, pesagem rápida, balanço calórico com gauge
- **Treino** — cronograma oficial SEG–SEX (41 exercícios), séries por bloco, cardio do dia com cronômetro, volume da sessão, 1RM estimado
- **Comida** — plano-base + lançamento por gramas, metas dinâmicas pelo peso
- **Evolução** — medidas (cintura, braços…), BF% Navy, volume, mapa dos 133 dias (sáb/dom = descanso)
- **Guia** — perfil, quanto comer, consultoria (BF%, FFMI, WHtR, zonas Karvonen, ISSN), backup exportar/importar

## Dados

Tudo fica no celular (IndexedDB + espelho localStorage, salvamento a cada toque). Backup em JSON na aba Guia.

## Alimentos (arquitetura unificada)

Tudo passa pelo DTO único `Food` (`src/lib/foods/schema.js` — valores por 100 g):

- `foods/mappers.js` — TACO e Open Food Facts → DTO (nulos viram 0, nunca NaN)
- `foods/foodService.js` — `buscarPorCodigoDeBarras` (banco → OFF → salva), `buscarPorNome` (TACO + banco, + OFF textual opcional), `calcularNutrientesPorPorcao` (regra de três, 2 casas)
- `foods/foodDb.js` — tabela `foods` (IndexedDB store `foods`): índice UNIQUE em `codigo_barras` + busca por `nome` sem acento
- `foods/http.js` — fetch com timeout (12–20 s)
- `lib/taco.js` / `lib/off.js` — transporte + compatibilidade (delegam aos mappers)

## Fórmulas (validadas)

TMB Mifflin-St Jeor · TDEE ×1,65 · US Navy/Hodgdon-Beckett · FFMI Kouri 1995 · WHtR Ashwell (NICE) · Tanaka 208−0,7×idade · Karvonen · Epley/Brzycki · ISSN 2017.
