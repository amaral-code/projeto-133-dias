import { create } from 'zustand'
import { MEALS } from '../data/meals.js'
import { loadPersisted, savePersistedDebounced } from '../lib/db.js'

// Estado central (substitui o `S` global do monolito).
// days: { [1..133]: { missions:{}, workoutDone, sets:[{exercise,setNumber,load,repsDone,repsTop,day}], weight, waist, waterMl } }
// mealLog: { [dia]: { [mealId]: { eaten, extraItems:[{id,...}] } } }
// loads: { [exerciseName]: number } — override de carga escolhido pelo usuário
// Data local YYYY-MM-DD (toISOString usa UTC e vira "amanhã" à noite no Brasil)
const todayISO = () => new Date().toLocaleDateString('en-CA')

const initialState = {
  hydrated: false,
  user: { name: 'Miguel', initials: 'MI', weight: 70, height: 167, age: 19, sex: 'M', defPct: 15 },
  startDate: todayISO(),
  activeTab: 'hoje',
  isDark: true,
  viewDay: null, // time-travel: null = dia real; número = inspecionar/testar qualquer dia 1..133
  trainKey: null, // dia de treino selecionado (SEG..SEX); null = automático pelo dia da semana
  days: {},
  mealLog: {},
  loads: {},
  activeWorkout: null
}

function persist(get) {
  const { user, startDate, days, mealLog, loads, trainKey, isDark } = get()
  savePersistedDebounced({ user, startDate, days, mealLog, loads, trainKey, isDark })
}

let toastTimer = null

export const useAppStore = create((set, get) => ({
  ...initialState,

  hydrate: async () => {
    const saved = await loadPersisted()
    if (saved) {
      const u = saved.user ?? {}
      // Migração: perfil antigo de exemplo (80.2kg/178cm) -> Miguel (70kg/167cm)
      if (Number(u.weight) === 80.2 && Number(u.height) === 178) {
        u.weight = 70; u.height = 167
      }
      // Migração: nome genérico -> Miguel; déficit kcal legado -> defPct %
      if (!u.name || u.name === 'Você' || u.name === 'Juliano Dias') { u.name = 'Miguel'; u.initials = 'MI' }
      if (u.deficit != null && u.defPct == null) {
        const bmr = Math.round(10 * (u.weight ?? 70) + 6.25 * (u.height ?? 167) - 5 * (u.age ?? 19) + 5)
        const tdee = Math.round((bmr * 1.65) / 10) * 10
        u.defPct = Math.max(5, Math.min(30, Math.round((u.deficit / tdee) * 100)))
        delete u.deficit
      }
      if (!u.sex) u.sex = 'M'
      if (saved.isDark == null) saved.isDark = initialState.isDark
      // Validação: storage corrompido nunca derruba o app
      const days = saved.days && typeof saved.days === 'object' ? saved.days : {}
      const mealLog = saved.mealLog && typeof saved.mealLog === 'object' ? saved.mealLog : {}
      const loads = saved.loads && typeof saved.loads === 'object' ? saved.loads : {}
      const trainKey = saved.trainKey && ['SEG', 'TER', 'QUA', 'QUI', 'SEX'].includes(saved.trainKey) ? saved.trainKey : null
      set({ ...saved, days, mealLog, loads, trainKey, user: { ...initialState.user, ...u }, hydrated: true })
    }
    else set({ hydrated: true })
  },

  setTab: (activeTab) => set({ activeTab }),
  setDark: (isDark) => { set({ isDark }); persist(get) },
  setUser: (patch) => { set((s) => { const user = { ...s.user, ...patch }; if (user.defPct != null) user.defPct = Math.max(0, Math.min(50, Number(user.defPct) || 0)); return { user } }); persist(get) },
  setStartDate: (startDate) => { set({ startDate }); persist(get) },
  setViewDay: (viewDay) => set({ viewDay: viewDay == null ? null : Math.min(133, Math.max(1, Math.round(Number(viewDay) || 1))) }),
  setTrainKey: (trainKey) => { set({ trainKey }); persist(get) },

  toast: null, // { text } — feedback global estilo app (não persiste)
  showToast: (text, ms = 2400) => {
    clearTimeout(toastTimer)
    set({ toast: { text, key: Date.now() } })
    toastTimer = setTimeout(() => set({ toast: null }), ms)
  },
  clearToast: () => { clearTimeout(toastTimer); set({ toast: null }) },

  toggleMission: (day, missionId) => {
    set((s) => {
      const d = s.days[day] ?? {}
      const missions = { ...(d.missions ?? {}), [missionId]: !d.missions?.[missionId] }
      return { days: { ...s.days, [day]: { ...d, missions } } }
    }); persist(get)
  },
  toggleMealEaten: (day, mealId) => {
    set((s) => {
      const log = s.mealLog[day] ?? {}
      const prev = log[mealId] ?? { eaten: false, extraItems: [] }
      return { mealLog: { ...s.mealLog, [day]: { ...log, [mealId]: { ...prev, eaten: !prev.eaten } } } }
    }); persist(get)
  },
  addFoodToMeal: (day, mealId, food) => {
    set((s) => {
      const log = s.mealLog[day] ?? {}
      const prev = log[mealId] ?? { eaten: false, extraItems: [] }
      return { mealLog: { ...s.mealLog, [day]: { ...log, [mealId]: { ...prev, extraItems: [...prev.extraItems, { ...food, id: Date.now() + Math.random() }] } } } }
    }); persist(get)
  },
  // "Tirar" um item do plano no dia (ex: não vou comer o pão hoje).
  // Guarda em mealLog[day][mealId].skipped = [nomes]; dayTotals desconta.
  toggleBaseSkipped: (day, mealId, itemName) => {
    set((s) => {
      const log = s.mealLog[day] ?? {}
      const prev = log[mealId] ?? { eaten: false, extraItems: [] }
      const skipped = Array.isArray(prev.skipped) ? [...prev.skipped] : []
      const i = skipped.indexOf(itemName)
      if (i >= 0) skipped.splice(i, 1)
      else skipped.push(itemName)
      return { mealLog: { ...s.mealLog, [day]: { ...log, [mealId]: { ...prev, skipped } } } }
    }); persist(get)
  },
  // "Trocar": tira o item do plano e lança o equivalente já na medida certa.
  swapBaseItem: (day, mealId, baseName, newExtra) => {
    const st = get()
    const log = st.mealLog[day] ?? {}
    const prev = log[mealId] ?? { eaten: false, extraItems: [] }
    const skipped = Array.isArray(prev.skipped) ? [...prev.skipped] : []
    if (!skipped.includes(baseName)) skipped.push(baseName)
    set((s) => {
      const lg = s.mealLog[day] ?? {}
      const pv = lg[mealId] ?? { eaten: false, extraItems: [] }
      const sk = Array.isArray(pv.skipped) ? [...pv.skipped] : []
      if (!sk.includes(baseName)) sk.push(baseName)
      return { mealLog: { ...s.mealLog, [day]: { ...lg, [mealId]: { ...pv, skipped: sk, extraItems: [...(pv.extraItems ?? []), { ...newExtra, id: Date.now() + Math.random(), swappedFrom: baseName }] } } } }
    }); persist(get)
  },
  removeExtraItem: (day, mealId, itemId) => {
    set((s) => {
      const log = s.mealLog[day] ?? {}
      const prev = log[mealId] ?? { eaten: false, extraItems: [] }
      return { mealLog: { ...s.mealLog, [day]: { ...log, [mealId]: { ...prev, extraItems: prev.extraItems.filter((i) => i.id !== itemId) } } } }
    }); persist(get)
  },
  // Upsert: concluir 2x a mesma série atualiza em vez de duplicar (corrige inflação de volume/XP)
  logSet: (day, setEntry) => {
    // setEntry: { exercise, setNumber, load, repsDone, repsTop }
    set((s) => {
      const d = s.days[day] ?? {}
      const prev = (d.sets ?? []).filter(
        (x) => !(x.exercise === setEntry.exercise && x.setNumber === setEntry.setNumber)
      )
      return { days: { ...s.days, [day]: { ...d, sets: [...prev, { ...setEntry, day }] } } }
    }); persist(get)
  },
  removeSet: (day, exercise, setNumber) => {
    set((s) => {
      const d = s.days[day] ?? {}
      return { days: { ...s.days, [day]: { ...d, sets: (d.sets ?? []).filter((x) => !(x.exercise === exercise && x.setNumber === setNumber)) } } }
    }); persist(get)
  },
  setLoad: (exercise, load) => {
    const v = load === '' ? '' : (Number.isFinite(Number(load)) ? Number(load) : 0)
    set((s) => ({ loads: { ...s.loads, [exercise]: v } })); persist(get)
  },
  addWater: (day, ml) => {
    set((s) => {
      const d = s.days[day] ?? {}
      return { days: { ...s.days, [day]: { ...d, waterMl: Math.max(0, (d.waterMl ?? 0) + ml) } } }
    }); persist(get)
  },
  logBody: (day, measures) => {
    // Aceita objeto completo {weight, waist, hip, chest, armR, armL, thighR, thighL, calf, neck}
    // Mantém compat com formato antigo {weight, waist}
    set((s) => {
      const d = s.days[day] ?? {}
      const clean = {}
      for (const [k, v] of Object.entries(measures ?? {})) {
        const n = Number(v)
        if (n > 0) clean[k] = n
      }
      return { days: { ...s.days, [day]: { ...d, ...clean } } }
    }); persist(get)
  },
  setWorkoutDone: (day, done = true) => {
    set((s) => {
      const d = s.days[day] ?? {}
      return { days: { ...s.days, [day]: { ...d, workoutDone: done } } }
    }); persist(get)
  },
  setCardioDone: (day, done = true) => {
    set((s) => {
      const d = s.days[day] ?? {}
      const missions = { ...(d.missions ?? {}) }
      // Missão 4 = cardio do dia: espelha o botão (marcar/desmarcar juntos)
      if (done) missions[4] = true
      else delete missions[4]
      return { days: { ...s.days, [day]: { ...d, cardioDone: done, missions } } }
    }); persist(get)
  },
  resetDay: (day) => {
    set((s) => {
      const days = { ...s.days }; delete days[day]
      const mealLog = { ...s.mealLog }; delete mealLog[day]
      return { days, mealLog }
    }); persist(get)
  },
  // Repete os extras de ontem no dia atual (economiza lançar tudo de novo)
  repeatYesterday: (day) => {
    const prev = get().mealLog[day - 1]
    if (!prev || day < 2) return 0
    const base = Date.now()
    let n = 0
    const copies = {}
    for (const [mealId, m] of Object.entries(prev)) {
      copies[mealId] = (m.extraItems ?? []).map((it) => ({ ...it, id: base + Math.random() + (n++) }))
    }
    if (!n) return 0
    set((s) => {
      const log = { ...(s.mealLog[day] ?? {}) }
      for (const [mealId, items] of Object.entries(copies)) {
        const cur = log[mealId] ?? { eaten: false, extraItems: [] }
        log[mealId] = { ...cur, extraItems: [...cur.extraItems, ...items] }
      }
      return { mealLog: { ...s.mealLog, [day]: log } }
    }); persist(get)
    return n
  },
  allSets: () => Object.values(get().days ?? {}).flatMap((d) => (Array.isArray(d?.sets) ? d.sets : [])),
  getMealItems: (day, mealId) => {
    const base = MEALS.find((m) => m.id === mealId)
    const skipped = get().mealLog[day]?.[mealId]?.skipped ?? []
    const extra = get().mealLog[day]?.[mealId]?.extraItems ?? []
    return [...(base?.items ?? []).filter((i) => !skipped.includes(i.name)), ...extra]
  }
}))
