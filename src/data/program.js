// GERADO a partir do cronograma oficial (projeto-133-dias.html) — NÃO EDITAR À MÃO.
// Regenere com: node scripts/gen-program.mjs
// Ordem oficial: SEG Costas/Bíceps/Ombro-Post · TER Peito/Tríceps/Ombro · QUA Pernas · QUI Trapézio/Abdômen/HIIT · SEX Antebraço/Pegada.
// setsPerPhase = nº de séries por bloco [Bloco1, Bloco2, Bloco3, Bloco4, Deload].
export const PROGRAM = {
  "SEG": {
    "key": "SEG",
    "label": "Treino A",
    "name": "Costas, Bíceps e Ombro Posterior",
    "sub": "Puxadas e remadas pesadas · ~75 min de musculação + cardio",
    "exercises": [
      {
        "id": 1,
        "name": "Puxada alta pronada (pegada aberta)",
        "muscle": "Dorsais · Bíceps",
        "type": "composto",
        "work": "Dorsais (principal), bíceps, romboides e trapézio inferior.",
        "steps": [
          "Sente com as coxas presas sob a almofada, peito alto, e segure a barra pronada (palmas para a frente), um pouco mais aberto que os ombros.",
          "Comece puxando as escápulas para baixo (afaste as orelhas dos ombros).",
          "Leve os cotovelos em direção às costelas até a barra chegar à altura da clavícula. Volte em 2–3 s até os braços quase estendidos."
        ],
        "attention": "Balançar o tronco para trás ou levar a barra atrás da nuca. Se precisa de impulso, a carga está alta demais. Faz mais de 10 reps com folga? Suba a carga.",
        "alt": [
          "SEM BARRA FIXA",
          "Esta puxada substitui a barra fixa na mesma faixa de séries e reps. Suba a carga quando fizer 10 reps limpas em todas as séries."
        ],
        "videoPt": "https://www.youtube.com/results?search_query=puxada%20alta%20pronada%20pegada%20aberta%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=lat%20pulldown%20wide%20grip%20proper%20form",
        "reps": {
          "lo": 6,
          "hi": 10,
          "timed": false,
          "raw": "6–10"
        },
        "rest": "2:30",
        "restSeconds": 150,
        "setsPerPhase": [
          3,
          4,
          4,
          4,
          2
        ],
        "star": false
      },
      {
        "id": 2,
        "name": "Remada curvada com barra livre",
        "muscle": "Costas (espessura)",
        "type": "composto",
        "work": "Dorsais, romboides, trapézio médio, bíceps. A lombar trabalha isometricamente.",
        "steps": [
          "Pés na largura dos ombros. Leve o quadril para trás até o tronco ficar a ~45°, coluna neutra, barra na altura dos joelhos.",
          "Puxe a barra em direção ao umbigo, com os cotovelos a ~45° do corpo, e aperte as escápulas no topo por 1 s.",
          "Desça em 2 s sem mudar o ângulo do tronco."
        ],
        "attention": "Subir o tronco para “roubar” a carga. Se acontecer, reduza o peso: o movimento é das costas, não do quadril.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=remada%20curvada%20com%20barra%20livre%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=barbell%20bent%20over%20row%20proper%20form",
        "reps": {
          "lo": 6,
          "hi": 10,
          "timed": false,
          "raw": "6–10"
        },
        "rest": "2:30",
        "restSeconds": 150,
        "setsPerPhase": [
          3,
          4,
          4,
          4,
          2
        ],
        "star": false
      },
      {
        "id": 3,
        "name": "Remada unilateral com halter (serrote)",
        "muscle": "Dorsais · Romboides",
        "type": "halteres",
        "work": "Dorsais, romboides, deltoide posterior e bíceps.",
        "steps": [
          "Apoie a mão e o joelho do mesmo lado no banco, tronco paralelo ao chão.",
          "Deixe o halter descer alongando o dorsal (a escápula acompanha o movimento).",
          "Puxe o cotovelo em direção ao quadril (não ao teto), pause 1 s e desça em 2 s. O descanso vale após os dois lados."
        ],
        "attention": "Girar o tronco para levantar o peso. Mantenha os ombros alinhados e paralelos ao chão.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=remada%20unilateral%20serrote%20com%20halter%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=one%20arm%20dumbbell%20row%20proper%20form",
        "reps": {
          "lo": 8,
          "hi": 12,
          "timed": false,
          "raw": "8–12 / lado"
        },
        "rest": "1:30",
        "restSeconds": 90,
        "setsPerPhase": [
          3,
          3,
          3,
          3,
          2
        ],
        "star": false
      },
      {
        "id": 4,
        "name": "Puxada alta (Lat Pulldown)",
        "muscle": "Dorsais (largura)",
        "type": "composto",
        "work": "Dorsais, redondo maior e bíceps.",
        "steps": [
          "Ajuste a almofada dos joelhos, sente com o peito alto. Pegada neutra ou supinada (palmas para você).",
          "Comece puxando os ombros para baixo e depois leve os cotovelos ao lado do corpo até a barra chegar à clavícula.",
          "Volte em 3 s, alongando completamente os dorsais."
        ],
        "attention": "Inclinar muito o tronco para trás e puxar com o impulso do corpo. Se precisa disso, a carga está alta demais.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=puxada%20alta%20pegada%20supinada%20lat%20pulldown%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=lat%20pulldown%20proper%20form",
        "reps": {
          "lo": 8,
          "hi": 12,
          "timed": false,
          "raw": "8–12"
        },
        "rest": "2:00",
        "restSeconds": 120,
        "setsPerPhase": [
          3,
          3,
          3,
          3,
          2
        ],
        "star": false
      },
      {
        "id": 5,
        "name": "Pullover no crossover com corda",
        "muscle": "Dorsais (isolado)",
        "type": "isolador",
        "work": "Dorsais (foco no alongamento).",
        "steps": [
          "Polia alta com a corda. Afaste-se dois passos, tronco levemente inclinado e braços quase estendidos.",
          "Leve a corda até as coxas em arco, mantendo os cotovelos semiflexionados e fixos.",
          "Volte devagar até a altura da cabeça, sentindo o dorsal alongar."
        ],
        "attention": "Dobrar os cotovelos e transformar o movimento em uma extensão de tríceps.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=pullover%20no%20crossover%20com%20corda%20dorsal%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=cable%20rope%20pullover%20lats%20proper%20form",
        "reps": {
          "lo": 10,
          "hi": 15,
          "timed": false,
          "raw": "10–15"
        },
        "rest": "1:15",
        "restSeconds": 75,
        "setsPerPhase": [
          2,
          3,
          3,
          3,
          2
        ],
        "star": true
      },
      {
        "id": 6,
        "name": "Crucifixo inverso com halteres (banco inclinado)",
        "muscle": "Ombro posterior",
        "type": "halteres",
        "work": "Deltoide posterior, romboides e trapézio médio.",
        "steps": [
          "Banco inclinado a 30–45°, peito apoiado, halteres pendurados com pegada neutra.",
          "Abra os braços em “T”, com os cotovelos levemente flexionados, liderando o movimento pelos cotovelos.",
          "Pause 1 s no topo e desça em 2 s."
        ],
        "attention": "Usar carga pesada e balançar. O deltoide posterior é pequeno: carga moderada e técnica limpa vencem.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=crucifixo%20inverso%20halteres%20banco%20inclinado%20deltoide%20posterior",
        "videoEn": "https://www.youtube.com/results?search_query=incline%20bench%20dumbbell%20reverse%20fly%20rear%20delt",
        "reps": {
          "lo": 12,
          "hi": 15,
          "timed": false,
          "raw": "12–15"
        },
        "rest": "1:00",
        "restSeconds": 60,
        "setsPerPhase": [
          3,
          4,
          4,
          4,
          2
        ],
        "star": true
      },
      {
        "id": 7,
        "name": "Face pull no crossover com corda",
        "muscle": "Ombro posterior · Saúde do ombro",
        "type": "isolador",
        "work": "Deltoide posterior, trapézio médio/inferior e manguito rotador.",
        "steps": [
          "Polia na altura do rosto com a corda. Dê dois passos para trás, braços estendidos.",
          "Puxe a corda em direção ao rosto, abrindo as mãos e girando os ombros para fora.",
          "Segure 1 s e volte em 2 s."
        ],
        "attention": "Inclinar o tronco para trás e puxar para o pescoço. A carga deve ser leve o bastante para você ficar parado.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=face%20pull%20crossover%20corda%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=cable%20face%20pull%20proper%20form",
        "reps": {
          "lo": 12,
          "hi": 20,
          "timed": false,
          "raw": "12–20"
        },
        "rest": "1:00",
        "restSeconds": 60,
        "setsPerPhase": [
          3,
          3,
          3,
          3,
          2
        ],
        "star": false
      },
      {
        "id": 8,
        "name": "Rosca direta com barra",
        "muscle": "Bíceps",
        "type": "composto",
        "work": "Bíceps e braquial.",
        "steps": [
          "Em pé, pés firmes, barra na largura dos ombros e cotovelos colados ao tronco.",
          "Suba a barra sem levar os cotovelos para frente.",
          "Desça em 3 s até quase estender por completo."
        ],
        "attention": "Balançar o tronco (“roubo”). Se precisar dele para subir, reduza a carga.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=rosca%20direta%20com%20barra%20como%20fazer%20corretamente",
        "videoEn": "https://www.youtube.com/results?search_query=barbell%20curl%20proper%20form",
        "reps": {
          "lo": 8,
          "hi": 12,
          "timed": false,
          "raw": "8–12"
        },
        "rest": "1:30",
        "restSeconds": 90,
        "setsPerPhase": [
          3,
          3,
          3,
          3,
          2
        ],
        "star": false
      },
      {
        "id": 9,
        "name": "Rosca inclinada com halteres",
        "muscle": "Bíceps (alongado)",
        "type": "halteres",
        "work": "Bíceps (cabeça longa) e braquial.",
        "steps": [
          "Banco a 45–60°, costas apoiadas, braços pendurados atrás da linha do tronco.",
          "Suba os halteres girando as palmas para cima, com os cotovelos parados.",
          "Desça em 3 s até alongar totalmente o bíceps."
        ],
        "attention": "Trazer os cotovelos para frente: você perde o alongamento, que é justamente o benefício deste exercício.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=rosca%20inclinada%20com%20halteres%20banco%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=incline%20dumbbell%20curl%20proper%20form",
        "reps": {
          "lo": 10,
          "hi": 12,
          "timed": false,
          "raw": "10–12"
        },
        "rest": "1:15",
        "restSeconds": 75,
        "setsPerPhase": [
          3,
          3,
          3,
          3,
          2
        ],
        "star": true
      },
      {
        "id": 10,
        "name": "Rosca martelo com corda no crossover",
        "muscle": "Braquial · Bíceps",
        "type": "isolador",
        "work": "Braquial, braquiorradial e bíceps.",
        "steps": [
          "Polia baixa com a corda, pegada neutra (polegares para cima).",
          "Com os cotovelos colados, suba a corda até a altura dos ombros.",
          "Desça em 2–3 s mantendo tensão o tempo todo."
        ],
        "attention": "Usar o impulso do corpo. O cabo mantém tensão constante — aproveite indo devagar.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=rosca%20martelo%20corda%20crossover%20polia%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=cable%20rope%20hammer%20curl%20proper%20form",
        "reps": {
          "lo": 10,
          "hi": 15,
          "timed": false,
          "raw": "10–15"
        },
        "rest": "1:00",
        "restSeconds": 60,
        "setsPerPhase": [
          2,
          3,
          3,
          3,
          2
        ],
        "star": true
      }
    ]
  },
  "TER": {
    "key": "TER",
    "label": "Treino B",
    "name": "Peito, Tríceps e Ombro Frontal/Lateral",
    "sub": "Supinos pesados, isolamento e elevações · ~75 min de musculação + cardio",
    "exercises": [
      {
        "id": 1,
        "name": "Supino reto com barra livre",
        "muscle": "Peito · Tríceps",
        "type": "composto",
        "work": "Peitoral, deltoide anterior e tríceps.",
        "steps": [
          "Deite com os olhos sob a barra, pés firmes no chão, escápulas juntas e para baixo (peito levemente estufado).",
          "Retire a barra e desça em 2 s até tocar o meio do peito, com os cotovelos a ~45–60° do tronco.",
          "Empurre a barra para cima e levemente para trás, sem descolar o quadril do banco."
        ],
        "attention": "Abrir os cotovelos a 90° (sobrecarrega o ombro) e quicar a barra no peito. Use pinos de segurança ou parceiro; sem eles, pare em RIR 2.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=supino%20reto%20com%20barra%20t%C3%A9cnica%20correta",
        "videoEn": "https://www.youtube.com/results?search_query=barbell%20bench%20press%20proper%20form",
        "reps": {
          "lo": 5,
          "hi": 8,
          "timed": false,
          "raw": "5–8"
        },
        "rest": "3:00",
        "restSeconds": 180,
        "setsPerPhase": [
          3,
          4,
          4,
          4,
          2
        ],
        "star": false
      },
      {
        "id": 2,
        "name": "Supino inclinado com halteres",
        "muscle": "Peito superior",
        "type": "halteres",
        "work": "Peitoral (porção superior), deltoide anterior e tríceps.",
        "steps": [
          "Banco a ~30°, escápulas para trás, halteres na altura do peito com os cotovelos a ~45–60°.",
          "Empurre em linha levemente diagonal até quase estender os braços.",
          "Desça em 2–3 s até sentir o peito alongar."
        ],
        "attention": "Banco muito inclinado (acima de ~45°) transforma o exercício em desenvolvimento de ombro.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=supino%20inclinado%20com%20halteres%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=incline%20dumbbell%20bench%20press%20proper%20form",
        "reps": {
          "lo": 8,
          "hi": 10,
          "timed": false,
          "raw": "8–10"
        },
        "rest": "2:30",
        "restSeconds": 150,
        "setsPerPhase": [
          3,
          4,
          4,
          4,
          2
        ],
        "star": false
      },
      {
        "id": 3,
        "name": "Crucifixo com halteres no banco reto",
        "muscle": "Peito (isolado)",
        "type": "halteres",
        "work": "Peitoral.",
        "steps": [
          "Deite no banco reto com um halter em cada mão sobre o peito, palmas de frente uma para a outra e cotovelos levemente flexionados.",
          "Abra os braços em arco até sentir o alongamento do peito, sem descer abaixo da linha dos ombros.",
          "Feche em arco até os halteres quase se tocarem, pause 1 s e desça em 3 s."
        ],
        "attention": "Dobrar os cotovelos e transformar o movimento em supino, ou descer demais. Use carga leve e mantenha o mesmo ângulo dos cotovelos.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=crucifixo%20com%20halteres%20banco%20reto%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=dumbbell%20fly%20flat%20bench%20proper%20form",
        "reps": {
          "lo": 10,
          "hi": 15,
          "timed": false,
          "raw": "10–15"
        },
        "rest": "1:30",
        "restSeconds": 90,
        "setsPerPhase": [
          3,
          3,
          3,
          3,
          2
        ],
        "star": true
      },
      {
        "id": 4,
        "name": "Crossover polia alta (cruzando as mãos)",
        "muscle": "Peito (contração)",
        "type": "isolador",
        "work": "Peitoral (fibras esternais).",
        "steps": [
          "Polias altas, um passo à frente, tronco levemente inclinado.",
          "Com os cotovelos semiflexionados e fixos, leve as mãos cruzando à frente do umbigo.",
          "Volte devagar sentindo o peito alongar."
        ],
        "attention": "Transformar o movimento em um supino de cabo, dobrando e esticando os cotovelos.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=crucifixo%20crossover%20polia%20alta%20como%20fazer%20peito",
        "videoEn": "https://www.youtube.com/results?search_query=cable%20crossover%20chest%20fly%20high%20to%20low",
        "reps": {
          "lo": 12,
          "hi": 15,
          "timed": false,
          "raw": "12–15"
        },
        "rest": "1:00",
        "restSeconds": 60,
        "setsPerPhase": [
          3,
          3,
          3,
          3,
          2
        ],
        "star": true
      },
      {
        "id": 5,
        "name": "Desenvolvimento com halteres sentado",
        "muscle": "Ombros",
        "type": "halteres",
        "work": "Deltoide anterior e lateral, tríceps.",
        "steps": [
          "Encosto a ~80°, halteres na altura das orelhas, antebraços verticais.",
          "Empurre para cima sem bater os halteres e sem arquear a lombar.",
          "Desça em 2–3 s até o cotovelo formar ~90°."
        ],
        "attention": "Arquear muito a lombar para empurrar. Se acontecer, reduza a carga e contraia o abdômen.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=desenvolvimento%20com%20halteres%20sentado%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=seated%20dumbbell%20shoulder%20press%20proper%20form",
        "reps": {
          "lo": 6,
          "hi": 10,
          "timed": false,
          "raw": "6–10"
        },
        "rest": "2:00",
        "restSeconds": 120,
        "setsPerPhase": [
          3,
          4,
          4,
          4,
          2
        ],
        "star": false
      },
      {
        "id": 6,
        "name": "Elevação lateral com halteres",
        "muscle": "Ombro lateral",
        "type": "halteres",
        "work": "Deltoide lateral.",
        "steps": [
          "Em pé, leve inclinação à frente, halteres ao lado do corpo, cotovelos levemente flexionados.",
          "Suba abrindo os braços até a altura do ombro, com os cotovelos liderando (como derramar um copo).",
          "Desça em 2 s, sem deixar os halteres caírem."
        ],
        "attention": "Usar embalo do tronco e encolher o trapézio. Carga menor, movimento mais limpo.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=eleva%C3%A7%C3%A3o%20lateral%20com%20halteres%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=dumbbell%20lateral%20raise%20proper%20form",
        "reps": {
          "lo": 12,
          "hi": 20,
          "timed": false,
          "raw": "12–20"
        },
        "rest": "1:00",
        "restSeconds": 60,
        "setsPerPhase": [
          3,
          4,
          4,
          4,
          2
        ],
        "star": true
      },
      {
        "id": 7,
        "name": "Tríceps testa com barra",
        "muscle": "Tríceps",
        "type": "composto",
        "work": "Tríceps (as três cabeças).",
        "steps": [
          "Deitado no banco, barra acima do peito com os braços apontando para o teto.",
          "Dobre apenas os cotovelos, levando a barra em direção à testa (ou levemente atrás da cabeça).",
          "Estenda os braços sem mover os ombros."
        ],
        "attention": "Deixar os cotovelos abrirem. Mantenha-os apontando para o teto e próximos entre si.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=tr%C3%ADceps%20testa%20com%20barra%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=skull%20crusher%20barbell%20proper%20form",
        "reps": {
          "lo": 8,
          "hi": 12,
          "timed": false,
          "raw": "8–12"
        },
        "rest": "1:30",
        "restSeconds": 90,
        "setsPerPhase": [
          3,
          3,
          3,
          3,
          2
        ],
        "star": false
      },
      {
        "id": 8,
        "name": "Extensão de tríceps acima da cabeça (halter)",
        "muscle": "Tríceps (alongado)",
        "type": "halteres",
        "work": "Tríceps (principalmente a cabeça longa).",
        "steps": [
          "Sentado ou em pé, segure um halter com as duas mãos atrás da cabeça.",
          "Cotovelos apontando para o teto e próximos das orelhas.",
          "Estenda os braços para cima e desça alongando bem o tríceps."
        ],
        "attention": "Abrir os cotovelos e arquear a lombar. Sente com encosto se precisar.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=tr%C3%ADceps%20franc%C3%AAs%20com%20halter%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=overhead%20dumbbell%20triceps%20extension%20proper%20form",
        "reps": {
          "lo": 10,
          "hi": 12,
          "timed": false,
          "raw": "10–12"
        },
        "rest": "1:15",
        "restSeconds": 75,
        "setsPerPhase": [
          3,
          3,
          3,
          3,
          2
        ],
        "star": true
      },
      {
        "id": 9,
        "name": "Tríceps corda no crossover (pushdown)",
        "muscle": "Tríceps (finalizador)",
        "type": "isolador",
        "work": "Tríceps (cabeça lateral e medial).",
        "steps": [
          "Polia alta com a corda, cotovelos colados ao tronco.",
          "Empurre a corda para baixo e abra as pontas no final.",
          "Volte controlando até a altura do peito."
        ],
        "attention": "Inclinar o tronco sobre a corda usando o peso do corpo.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=tr%C3%ADceps%20corda%20polia%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=rope%20triceps%20pushdown%20proper%20form",
        "reps": {
          "lo": 10,
          "hi": 15,
          "timed": false,
          "raw": "10–15"
        },
        "rest": "1:00",
        "restSeconds": 60,
        "setsPerPhase": [
          2,
          3,
          3,
          3,
          2
        ],
        "star": true
      }
    ]
  },
  "QUA": {
    "key": "QUA",
    "label": "Treino C",
    "name": "Pernas: unilateral, sem barra nas costas",
    "sub": "Sofrimento e hipertrofia · ~85 min de musculação + cardio leve",
    "exercises": [
      {
        "id": 1,
        "name": "Agachamento búlgaro com halteres",
        "muscle": "Quadríceps · Glúteo",
        "type": "halteres",
        "work": "Quadríceps, glúteo e adutores; o core estabiliza.",
        "steps": [
          "Apoie o peito do pé de trás no banco; o pé da frente fica ~1,5 passo à frente do banco.",
          "Desça em 3 s com o tronco levemente inclinado (mais glúteo) ou vertical (mais quadríceps); calcanhar da frente no chão.",
          "Empurre pelo pé da frente até subir, sem se impulsionar com a perna de trás. O descanso vale após as duas pernas."
        ],
        "attention": "Pé da frente muito perto do banco (joelho invade e incomoda). Ajuste a distância na Semana 1 e mantenha.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=agachamento%20b%C3%BAlgaro%20com%20halteres%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=dumbbell%20bulgarian%20split%20squat%20proper%20form",
        "reps": {
          "lo": 8,
          "hi": 12,
          "timed": false,
          "raw": "8–12 / perna"
        },
        "rest": "2:30",
        "restSeconds": 150,
        "setsPerPhase": [
          3,
          4,
          4,
          4,
          2
        ],
        "star": false
      },
      {
        "id": 2,
        "name": "Passada com halteres (Walking Lunge)",
        "muscle": "Quadríceps · Glúteo",
        "type": "halteres",
        "work": "Quadríceps, glúteo e adutores.",
        "steps": [
          "Halteres ao lado do corpo, tronco firme.",
          "Dê um passo longo e desça até o joelho de trás quase tocar o chão.",
          "Empurre pelo pé da frente e dê o próximo passo com a outra perna."
        ],
        "attention": "Passos curtos demais (sobrecarrega o joelho) ou tronco inclinado para frente demais.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=passada%20com%20halteres%20walking%20lunge%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=dumbbell%20walking%20lunge%20proper%20form",
        "reps": {
          "lo": 10,
          "hi": 12,
          "timed": false,
          "raw": "10–12 passos / perna"
        },
        "rest": "2:00",
        "restSeconds": 120,
        "setsPerPhase": [
          3,
          3,
          3,
          3,
          2
        ],
        "star": false
      },
      {
        "id": 3,
        "name": "Stiff com halteres",
        "muscle": "Posterior de coxa · Glúteo",
        "type": "halteres",
        "work": "Posteriores da coxa, glúteo e lombar (isometricamente).",
        "steps": [
          "Em pé, halteres à frente das coxas, joelhos levemente flexionados e fixos.",
          "Leve o quadril para trás (como fechar uma porta com o glúteo), com os halteres deslizando rente às pernas.",
          "Desça até sentir o posterior alongar (em geral abaixo do joelho) e suba estendendo o quadril."
        ],
        "attention": "Arredondar a lombar ou dobrar os joelhos demais (vira agachamento). A coluna fica neutra o tempo todo.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=stiff%20com%20halteres%20como%20fazer%20posterior%20de%20coxa",
        "videoEn": "https://www.youtube.com/results?search_query=dumbbell%20romanian%20deadlift%20proper%20form",
        "reps": {
          "lo": 8,
          "hi": 12,
          "timed": false,
          "raw": "8–12"
        },
        "rest": "2:00",
        "restSeconds": 120,
        "setsPerPhase": [
          4,
          4,
          4,
          4,
          2
        ],
        "star": false
      },
      {
        "id": 4,
        "name": "Hip thrust com barra (costas no banco)",
        "muscle": "Glúteos",
        "type": "composto",
        "work": "Glúteo máximo e posteriores da coxa.",
        "steps": [
          "Apoie as omoplatas no banco, barra sobre o quadril com toalha ou almofada (a barra não vai nas costas).",
          "Pés na largura do quadril, de modo que as canelas fiquem verticais no topo.",
          "Suba até o quadril alinhar com ombros e joelhos, pause 1 s e desça em 2 s."
        ],
        "attention": "Hiperestender a lombar no topo. Queixo no peito e contraia o glúteo — o movimento termina no quadril.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=hip%20thrust%20com%20barra%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=barbell%20hip%20thrust%20proper%20form",
        "reps": {
          "lo": 8,
          "hi": 12,
          "timed": false,
          "raw": "8–12"
        },
        "rest": "2:00",
        "restSeconds": 120,
        "setsPerPhase": [
          3,
          4,
          4,
          4,
          2
        ],
        "star": false
      },
      {
        "id": 5,
        "name": "Cadeira extensora",
        "muscle": "Quadríceps (isolado)",
        "type": "isolador",
        "work": "Quadríceps.",
        "steps": [
          "Ajuste o encosto para o joelho alinhar ao eixo e o rolo ficar no tornozelo.",
          "Estenda as pernas de forma explosiva até quase travar e pause 1 s.",
          "Desça em 3 s, sem deixar as placas baterem."
        ],
        "attention": "Usar embalo (jogar o tronco para trás). Ideal para drop set na última série dos Blocos 3 e 4.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=cadeira%20extensora%20como%20fazer%20corretamente",
        "videoEn": "https://www.youtube.com/results?search_query=leg%20extension%20machine%20proper%20form",
        "reps": {
          "lo": 12,
          "hi": 15,
          "timed": false,
          "raw": "12–15"
        },
        "rest": "1:30",
        "restSeconds": 90,
        "setsPerPhase": [
          3,
          4,
          4,
          4,
          2
        ],
        "star": true
      },
      {
        "id": 6,
        "name": "Stiff unilateral com halter ou kettlebell",
        "muscle": "Posterior de coxa",
        "type": "halteres",
        "work": "Posteriores da coxa, glúteo e estabilizadores do quadril.",
        "steps": [
          "Segure o halter ou kettlebell na mão oposta à perna de apoio.",
          "Incline o tronco à frente enquanto a perna livre vai para trás, joelho de apoio semiflexionado.",
          "Volte contraindo o glúteo, mantendo o quadril alinhado (sem abrir)."
        ],
        "attention": "Girar o quadril para o lado. Comece leve para aprender o equilíbrio.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=stiff%20unilateral%20com%20halter%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=single%20leg%20dumbbell%20romanian%20deadlift%20proper%20form",
        "reps": {
          "lo": 10,
          "hi": 12,
          "timed": false,
          "raw": "10–12 / perna"
        },
        "rest": "1:15",
        "restSeconds": 75,
        "setsPerPhase": [
          2,
          3,
          3,
          3,
          2
        ],
        "star": false
      },
      {
        "id": 7,
        "name": "Panturrilha em pé unilateral com halter",
        "muscle": "Panturrilha",
        "type": "halteres",
        "work": "Gastrocnêmio (“batata da perna”).",
        "steps": [
          "Apoie a ponta de um pé em uma anilha ou degrau, com um halter na mão do mesmo lado e a outra mão em um apoio.",
          "Desça o calcanhar alongando a panturrilha por 1 s.",
          "Suba o máximo que conseguir e segure 1 s no topo."
        ],
        "attention": "Quicar em vez de pausar. A pausa embaixo (alongamento) é onde o estímulo acontece.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=panturrilha%20em%20p%C3%A9%20unilateral%20com%20halter%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=single%20leg%20dumbbell%20calf%20raise%20proper%20form",
        "reps": {
          "lo": 10,
          "hi": 15,
          "timed": false,
          "raw": "10–15 / perna"
        },
        "rest": "1:00",
        "restSeconds": 60,
        "setsPerPhase": [
          3,
          4,
          4,
          4,
          2
        ],
        "star": true
      },
      {
        "id": 8,
        "name": "Panturrilha sentada com halter no joelho",
        "muscle": "Panturrilha (sóleo)",
        "type": "halteres",
        "work": "Sóleo (parte profunda da panturrilha).",
        "steps": [
          "Sentado no banco, ponta dos pés em uma anilha, halter apoiado sobre os joelhos.",
          "Deixe o calcanhar descer, alongando por 1 s.",
          "Suba o máximo possível e segure 1 s."
        ],
        "attention": "Meia amplitude. Vá do alongamento total até a contração máxima.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=panturrilha%20sentada%20com%20halter%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=seated%20dumbbell%20calf%20raise%20proper%20form",
        "reps": {
          "lo": 12,
          "hi": 20,
          "timed": false,
          "raw": "12–20"
        },
        "rest": "1:00",
        "restSeconds": 60,
        "setsPerPhase": [
          2,
          3,
          3,
          3,
          2
        ],
        "star": true
      }
    ]
  },
  "QUI": {
    "key": "QUI",
    "label": "Treino D",
    "name": "Trapézio, Abdômen e HIIT",
    "sub": "Cargas altas no trapézio, abdômen com sobrecarga · ~65 min de musculação + 45 min de HIIT",
    "exercises": [
      {
        "id": 1,
        "name": "Encolhimento com halteres",
        "muscle": "Trapézio superior",
        "type": "halteres",
        "work": "Trapézio superior e médio.",
        "steps": [
          "Em pé, halteres ao lado do corpo, ombros relaxados embaixo.",
          "Suba os ombros em direção às orelhas (sem girar), pause 1–2 s no topo.",
          "Desça em 2 s até alongar completamente. Straps liberados para ir mais pesado."
        ],
        "attention": "Girar os ombros para frente e para trás. O movimento é reto: para cima e para baixo.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=encolhimento%20com%20halteres%20trap%C3%A9zio%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=dumbbell%20shrug%20proper%20form",
        "reps": {
          "lo": 8,
          "hi": 12,
          "timed": false,
          "raw": "8–12"
        },
        "rest": "2:00",
        "restSeconds": 120,
        "setsPerPhase": [
          4,
          4,
          4,
          4,
          2
        ],
        "star": true
      },
      {
        "id": 2,
        "name": "Encolhimento na Smith",
        "muscle": "Trapézio",
        "type": "composto",
        "work": "Trapézio superior.",
        "steps": [
          "Barra na altura das coxas, pegada na largura dos ombros; use straps se a pegada limitar.",
          "Suba os ombros o máximo possível e segure 1 s.",
          "Desça em 2 s com controle total."
        ],
        "attention": "Dobrar os cotovelos para ajudar. Os braços ficam apenas “pendurados”.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=encolhimento%20na%20smith%20trap%C3%A9zio%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=smith%20machine%20shrug%20proper%20form",
        "reps": {
          "lo": 10,
          "hi": 15,
          "timed": false,
          "raw": "10–15"
        },
        "rest": "1:30",
        "restSeconds": 90,
        "setsPerPhase": [
          3,
          4,
          4,
          4,
          2
        ],
        "star": false
      },
      {
        "id": 3,
        "name": "Caminhada do fazendeiro",
        "muscle": "Trapézio · Pegada · Core",
        "type": "composto",
        "work": "Trapézio, antebraços (pegada), core e glúteos.",
        "steps": [
          "Segure halteres ou kettlebells pesados ao lado do corpo.",
          "Postura alta, ombros para trás e para baixo, abdômen firme.",
          "Caminhe com passos curtos e firmes pelo tempo ou distância indicados."
        ],
        "attention": "Deixar os ombros caírem para frente. Se a postura falha, a carga está alta demais.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=farmer's%20walk%20caminhada%20do%20fazendeiro%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=farmer's%20walk%20proper%20form",
        "reps": {
          "lo": 30,
          "hi": 45,
          "timed": true,
          "raw": "30–40 m (30–45 s)"
        },
        "rest": "2:00",
        "restSeconds": 120,
        "setsPerPhase": [
          3,
          4,
          4,
          4,
          2
        ],
        "star": false
      },
      {
        "id": 4,
        "name": "Elevação lateral no crossover (unilateral)",
        "muscle": "Ombro lateral (2ª vez na semana)",
        "type": "isolador",
        "work": "Deltoide lateral.",
        "steps": [
          "Polia baixa, cabo passando na frente do corpo, mão oposta à polia.",
          "Suba o braço lateralmente até a altura do ombro, cotovelo levemente flexionado.",
          "Desça em 2 s. O cabo mantém tensão mesmo embaixo, ao contrário do halter."
        ],
        "attention": "Usar o corpo para levantar. Use uma carga que permita controle.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=eleva%C3%A7%C3%A3o%20lateral%20no%20crossover%20unilateral%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=cable%20lateral%20raise%20single%20arm%20proper%20form",
        "reps": {
          "lo": 12,
          "hi": 20,
          "timed": false,
          "raw": "12–20 / lado"
        },
        "rest": "1:00",
        "restSeconds": 60,
        "setsPerPhase": [
          3,
          3,
          3,
          3,
          2
        ],
        "star": true
      },
      {
        "id": 5,
        "name": "Abdominal na polia (crunch ajoelhado)",
        "muscle": "Reto abdominal",
        "type": "isolador",
        "work": "Reto abdominal.",
        "steps": [
          "Ajoelhado diante da polia alta, segure a corda junto à testa.",
          "Arredonde a coluna aproximando as costelas do quadril (o quadril fica parado).",
          "Volte em 2 s. Aumente a carga toda semana, como em qualquer outro exercício."
        ],
        "attention": "Puxar com os braços e sentar sobre os calcanhares. O trabalho é do abdômen.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=abdominal%20na%20polia%20ajoelhado%20corda%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=kneeling%20cable%20crunch%20proper%20form",
        "reps": {
          "lo": 8,
          "hi": 12,
          "timed": false,
          "raw": "8–12"
        },
        "rest": "1:30",
        "restSeconds": 90,
        "setsPerPhase": [
          4,
          4,
          4,
          4,
          2
        ],
        "star": true
      },
      {
        "id": 6,
        "name": "Elevação de joelhos na barra fixa",
        "muscle": "Abdômen inferior",
        "type": "composto",
        "work": "Abdômen (parte inferior) e flexores do quadril.",
        "steps": [
          "Pendure-se na barra, ombros ativos, sem balançar.",
          "Eleve os joelhos flexionados até a altura do quadril (ou mais), inclinando o quadril para trás no final.",
          "Desça em 2 s sem balançar. Progressão: pausa de 1 s no topo → joelhos mais altos, em direção ao peito."
        ],
        "attention": "Balançar o corpo e usar o embalo. Cada repetição parte do zero.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=eleva%C3%A7%C3%A3o%20de%20joelhos%20na%20barra%20fixa%20abd%C3%B4men%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=hanging%20knee%20raise%20proper%20form",
        "reps": {
          "lo": 10,
          "hi": 15,
          "timed": false,
          "raw": "10–15"
        },
        "rest": "1:30",
        "restSeconds": 90,
        "setsPerPhase": [
          3,
          4,
          4,
          4,
          2
        ],
        "star": false
      },
      {
        "id": 7,
        "name": "Abdominal declinado com anilha",
        "muscle": "Abdômen (sobrecarga)",
        "type": "isolador",
        "work": "Reto abdominal.",
        "steps": [
          "Banco declinado (ou pés presos), anilha abraçada junto ao peito.",
          "Suba enrolando a coluna, sem jogar o tronco.",
          "Desça em 3 s. Se o banco não declinar, faça crunch no chão com a anilha."
        ],
        "attention": "Puxar o pescoço para frente. Olhe para o teto durante o movimento.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=abdominal%20declinado%20com%20anilha%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=decline%20sit%20up%20with%20weight%20plate%20proper%20form",
        "reps": {
          "lo": 10,
          "hi": 15,
          "timed": false,
          "raw": "10–15"
        },
        "rest": "1:15",
        "restSeconds": 75,
        "setsPerPhase": [
          3,
          3,
          3,
          3,
          2
        ],
        "star": false
      },
      {
        "id": 8,
        "name": "Prancha com anilha nas costas",
        "muscle": "Core",
        "type": "isolador",
        "work": "Core completo (reto abdominal, transverso e oblíquos).",
        "steps": [
          "Antebraços no chão, corpo em linha reta da cabeça aos calcanhares.",
          "Peça a alguém que apoie a anilha nas suas costas.",
          "Contraia glúteo e abdômen. Encerre quando a postura falhar."
        ],
        "attention": "Deixar o quadril cair (lombar dói) ou subir demais. Pare a série ao perder a posição.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=prancha%20com%20anilha%20nas%20costas%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=weighted%20plank%20proper%20form",
        "reps": {
          "lo": 30,
          "hi": 60,
          "timed": true,
          "raw": "30–60 s"
        },
        "rest": "1:00",
        "restSeconds": 60,
        "setsPerPhase": [
          3,
          3,
          3,
          3,
          2
        ],
        "star": false
      }
    ]
  },
  "SEX": {
    "key": "SEX",
    "label": "Treino E",
    "name": "Antebraço, Pegada e Cardio de Resistência",
    "sub": "Treino curto (~40 min) · pegada forte melhora todas as suas puxadas",
    "exercises": [
      {
        "id": 1,
        "name": "Rosca inversa com barra",
        "muscle": "Antebraço · Braquiorradial",
        "type": "composto",
        "work": "Braquiorradial e extensores do antebraço.",
        "steps": [
          "Pegada pronada (palmas para baixo), na largura dos ombros.",
          "Cotovelos fixos, punhos neutros; suba a barra até a altura dos ombros.",
          "Desça em 3 s até quase estender."
        ],
        "attention": "Deixar os punhos dobrarem. Mantenha-os alinhados ao antebraço.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=rosca%20inversa%20com%20barra%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=barbell%20reverse%20curl%20proper%20form",
        "reps": {
          "lo": 8,
          "hi": 12,
          "timed": false,
          "raw": "8–12"
        },
        "rest": "1:30",
        "restSeconds": 90,
        "setsPerPhase": [
          4,
          4,
          4,
          4,
          2
        ],
        "star": true
      },
      {
        "id": 2,
        "name": "Flexão de punho com barra",
        "muscle": "Flexores do antebraço",
        "type": "composto",
        "work": "Flexores do punho e dos dedos.",
        "steps": [
          "Sentado, antebraços apoiados nas coxas ou no banco, palmas para cima.",
          "Deixe a barra rolar até a ponta dos dedos e depois feche a mão.",
          "Suba o máximo que puder, com amplitude total."
        ],
        "attention": "Levantar os antebraços do apoio. Só o punho se move.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=rosca%20de%20punho%20flex%C3%A3o%20de%20punho%20barra%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=barbell%20wrist%20curl%20proper%20form",
        "reps": {
          "lo": 12,
          "hi": 20,
          "timed": false,
          "raw": "12–20"
        },
        "rest": "1:00",
        "restSeconds": 60,
        "setsPerPhase": [
          4,
          4,
          4,
          4,
          2
        ],
        "star": true
      },
      {
        "id": 3,
        "name": "Extensão de punho com halteres",
        "muscle": "Extensores do antebraço",
        "type": "halteres",
        "work": "Extensores do punho e dos dedos.",
        "steps": [
          "Antebraço apoiado, palma para baixo, halter leve.",
          "Suba o punho o máximo possível.",
          "Desça devagar até o alongamento total."
        ],
        "attention": "Usar carga excessiva. Músculo pequeno e sensível: leve e controlado.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=extens%C3%A3o%20de%20punho%20com%20halteres%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=dumbbell%20wrist%20extension%20proper%20form",
        "reps": {
          "lo": 15,
          "hi": 20,
          "timed": false,
          "raw": "15–20"
        },
        "rest": "1:00",
        "restSeconds": 60,
        "setsPerPhase": [
          3,
          3,
          3,
          3,
          2
        ],
        "star": true
      },
      {
        "id": 4,
        "name": "Rosca martelo com halteres",
        "muscle": "Braquiorradial · Bíceps",
        "type": "halteres",
        "work": "Braquiorradial, braquial e bíceps.",
        "steps": [
          "Em pé, halteres ao lado do corpo, pegada neutra (palmas uma de frente para a outra).",
          "Suba sem balançar, cotovelos colados.",
          "Desça em 3 s."
        ],
        "attention": "Balançar o corpo. Alterne os braços apenas se estiver com dificuldade para manter a postura.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=rosca%20martelo%20com%20halteres%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=dumbbell%20hammer%20curl%20proper%20form",
        "reps": {
          "lo": 8,
          "hi": 12,
          "timed": false,
          "raw": "8–12"
        },
        "rest": "1:15",
        "restSeconds": 75,
        "setsPerPhase": [
          3,
          3,
          3,
          3,
          2
        ],
        "star": false
      },
      {
        "id": 5,
        "name": "Suspensão na barra fixa (Dead Hang)",
        "muscle": "Pegada · Ombros",
        "type": "composto",
        "work": "Flexores dos dedos, antebraço e estabilizadores do ombro.",
        "steps": [
          "Segure a barra e pendure-se com os ombros ativos (sem relaxar totalmente).",
          "Mantenha o corpo parado, respirando normalmente.",
          "Segure até quase soltar. Passou de 60 s? Prenda anilha ou use uma toalha na barra."
        ],
        "attention": "Balançar. Fique quieto: o objetivo é força de pegada.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=dead%20hang%20barra%20fixa%20pegada%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=dead%20hang%20grip%20strength%20proper%20form",
        "reps": {
          "lo": 30,
          "hi": 60,
          "timed": true,
          "raw": "30–60 s"
        },
        "rest": "1:30",
        "restSeconds": 90,
        "setsPerPhase": [
          3,
          3,
          3,
          3,
          2
        ],
        "star": false
      },
      {
        "id": 6,
        "name": "Pinça de anilha (Plate Pinch)",
        "muscle": "Pegada de dedos",
        "type": "isolador",
        "work": "Flexores dos dedos e polegar.",
        "steps": [
          "Junte duas anilhas lisas de 5–10 kg, lado liso para fora.",
          "Segure só com os dedos e o polegar (sem apoiar a palma).",
          "Mantenha pelo tempo indicado. Aumente o peso ou o tempo gradualmente."
        ],
        "attention": "Usar peso alto demais e soltar em 5 s. Comece leve.",
        "alt": null,
        "videoPt": "https://www.youtube.com/results?search_query=plate%20pinch%20pin%C3%A7a%20de%20anilha%20pegada%20como%20fazer",
        "videoEn": "https://www.youtube.com/results?search_query=plate%20pinch%20grip%20strength%20proper%20form",
        "reps": {
          "lo": 20,
          "hi": 40,
          "timed": true,
          "raw": "20–40 s"
        },
        "rest": "1:00",
        "restSeconds": 60,
        "setsPerPhase": [
          3,
          3,
          3,
          3,
          2
        ],
        "star": false
      }
    ]
  }
}

// Séries concretas p/ um bloco (0..4): [{setNumber, repsTarget:[lo,hi], timed, restSeconds}]
export function setsForBlock(ex, blockIdx) {
  const n = ex.setsPerPhase?.[blockIdx] ?? ex.setsPerPhase?.[0] ?? 3
  return Array.from({ length: n }, (_, k) => ({
    setNumber: k + 1,
    repsTarget: [ex.reps.lo, ex.reps.hi],
    timed: !!ex.reps.timed,
    restSeconds: ex.restSeconds ?? 60,
  }))
}

export const DAY_ORDER = ['SEG', 'TER', 'QUA', 'QUI', 'SEX']

export const MISSIONS_TEMPLATE = [
  { id: 1, title: 'Bater Meta de Calorias', desc: 'Dentro da margem de 100 kcal', icon: 'utensils', xp: 20 },
  { id: 2, title: 'Beber Meta de Água', desc: 'Hidratação total (≈43ml/kg)', icon: 'droplet', xp: 10 },
  { id: 3, title: 'Treino de Força', desc: 'Finalizar séries programadas', icon: 'dumbbell', xp: 50 },
  { id: 4, title: 'Cardio do Dia', desc: 'Zona 2 / HIIT / limiar conforme o dia', icon: 'flame', xp: 20 },
  { id: 5, title: 'Dormir 7.5h+', desc: 'Higiene do sono 22:30', icon: 'moon', xp: 10 }
]
