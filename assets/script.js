/* ============================================================
   Typing Trainer v4 — JS
   - 2 righe tipo 10fastfingers
   - niente parole tagliate o nascoste
   - highlight live verde/rosso
   - tempo + WPM live
   - modalità: facile, standard, medio, difficile, ringPinky
============================================================ */

/* ------------------------------------------------------------
   DOM ELEMENTS
------------------------------------------------------------ */
const row1El = document.getElementById("wordsHistory");   // riga alta
const row2El = document.getElementById("wordsCurrent");   // riga bassa
const inputEl = document.getElementById("typingInput");

const durationEl = document.getElementById("duration");
const modeEl = document.getElementById("mode");

const overlay = document.getElementById("resultsOverlay");
const closeOverlayBtn = document.getElementById("btnCloseOverlay");

const wpmFinalEl = document.getElementById("wpmFinal");
const cpmFinalEl = document.getElementById("cpmFinal");
const accuracyFinalEl = document.getElementById("accuracyFinal");
const pbFinalEl = document.getElementById("pbFinal");
const pbValue = document.getElementById("pbValue");

const problemKeysEl = document.getElementById("problemKeys");
const fingerTipsEl = document.getElementById("fingerTips");

const liveTimeEl = document.getElementById("liveTime");
const liveWpmEl = document.getElementById("liveWpm");

/* ------------------------------------------------------------
   WORD LISTS PER DIFFICOLTÀ
------------------------------------------------------------ */

// FACILE
const WORDS_EASY = [
  "il","la","i","le","di","a","da","in","con","su","per","tra","fra",
  "un","uno","una","e","o","ma","se","no","si","io","tu","lui","lei",
  "noi","voi","loro","ho","hai","ha","abbiamo","avete","hanno","sono",
  "sei","è","casa","pane","sole","mare","luna","cane","gatto","mano",
  "anno","ora","via","qui","bene","male","alto","basso","nuovo",
  "vecchio","giorno","notte","cielo","terra","acqua","aria","luce",
  "pace","amore","tempo","cosa","gente","vita","fine","inizio",
  "padre","madre","figlio","figlia","porta","strada","muro","treno",
  "auto","testa","faccia","nome","verbo","sale","vino","olio","fame",
  "sete","freddo","caldo","gioco","libri","fiori","erba"
];

// MEDIO
const WORDS_MEDIUM = [
  "essere","avere","fare","dire","potere","volere","sapere","stare",
  "dovere","vedere","andare","venire","dare","parlare","trovare",
  "sentire","lasciare","persona","tempo","signore","paese","lavoro",
  "famiglia","amico","esempio","problema","momento","pensare",
  "prendere","guardare","scrivere","leggere","correre","bello",
  "piccolo","buono","grande","anche","sempre","molto","presto","tardi",
  "perché","cioè","città","caffè","giù","più","ciò","aglio","sbaglio",
  "scena","scegliere","ghiaccio","chiesa","macchina","attenzione",
  "difficile","possibile","invece","quando","mentre","durante",
  "contro","secondo","insieme","subito","peccato","appunto","davvero",
  "purtroppo","sicuramente","finalmente","veramente","soltanto",
  "neanche","nessuno","qualcuno","qualcosa","dovrebbe","potrebbe",
  "dovuto","voluto","visto","fatto","detto","preso","messo","aperto",
  "chiuso","vinto","perso","uscire","tornare","capire","finire",
  "preferire","pulire","spedire"
];

// DIFFICILE BASE
const WORDS_DIFFICULT_BASE = [
  "probabilmente","improvvisamente","contemporaneamente","attraverso",
  "descrizione","organizzazione","immediatamente","soddisfazione",
  "indipendentemente","rappresentare","sviluppare","comprendere",
  "esclusivamente","caratteristica","responsabilità",
  "quarantotto",
  "lunedì","martedì","mercoledì","giovedì","venerdì","sabato","domenica"
];

// PAROLE PIÙ LUNGHE DALLE LISTE PRECEDENTI (vecchio JS)
const WORDS_LONG_FROM_OLD = [
  "digitare","computer","tastiera","programma","scrittura","precisione",
  "risultato","software","allenamento","ripetizione","carattere",
  "modalità","sessione","inserimento","automatizzare","digitazione",
  "memoria","controllo",
  "pupazzo","pianura","pulsante","pigrizia","migliore","lampone",
  "lingua","ultimo"
];

// LISTA SPECIFICA PER ANULARI & MIGNOLI (modalità ringPinky)
const WORDS_RING_PINKY = [
  "qualità","azzurro","zaino","azzera","pazzo","pizzo","pupazzo",
  "pianura","pulsante","pugno","pigrizia","migliore","molla","mamma",
  "logico","lampone","lampo","lilla","lume","lingua","molto","ultimo",
  "ù","ò"
];

// MIX PER STANDARD E HARD
const WORDS_STANDARD = [...WORDS_EASY, ...WORDS_MEDIUM];
const WORDS_DIFFICULT = [...WORDS_DIFFICULT_BASE, ...WORDS_LONG_FROM_OLD];
const WORDS_HARD = [...WORDS_MEDIUM, ...WORDS_DIFFICULT];

/* ------------------------------------------------------------
   STATE
------------------------------------------------------------ */
// stream di parole continuo
let wordsStream = [];

// indice globale della parola corrente nello stream
let cursorIndex = 0;

// indice globale della prima parola della riga 1
let offsetIndex = 0;

// quante parole stanno effettivamente in riga 1 e 2
let row1Count = 0;
let row2Count = 0;

// risultati per colorare parole già digitate
let resultsHistory = []; // {word, ok}

let correct = 0;
let incorrect = 0;
let charsTyped = 0;

let active = false;
let timeLeft = 60;
let testDuration = 60;
let timer = null;

let pressedKeys = {};

let fingerErrors = {
  leftPinky: 0,
  leftRing: 0,
  rightRing: 0,
  rightPinky: 0
};

/* ------------------------------------------------------------
   UTILS: SCELTA LISTA IN BASE ALLA MODALITÀ
------------------------------------------------------------ */
function getActiveWordList() {
  const mode = modeEl.value;
  switch (mode) {
    case "easy":
      return WORDS_EASY;
    case "medium":
      return WORDS_MEDIUM;
    case "hard":
      return WORDS_HARD;
    case "ringPinky":
      return WORDS_RING_PINKY;
    case "standard":
    default:
      return WORDS_STANDARD;
  }
}

function sampleWord() {
  const list = getActiveWordList();
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

// assicura che ci siano sempre parole avanti nello stream
function ensureWords(minAhead = 80) {
  const needed = cursorIndex + minAhead;
  while (wordsStream.length < needed) {
    wordsStream.push(sampleWord());
  }
}

async function saveToServer(session) {
  try {
    await fetch("save_score.php", {
      method: "POST",
      body: JSON.stringify(session)
    });
  } catch (e) {
    console.warn("Errore salvataggio server:", e);
  }
}

function formatTime(sec) {
  if (sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function updateHUD() {
  if (liveTimeEl) {
    liveTimeEl.textContent = formatTime(timeLeft);
  }

  const elapsed = testDuration - timeLeft;
  let wpmLive = 0;
  if (elapsed > 0) {
    wpmLive = Math.round(correct / (elapsed / 60));
  }

  if (liveWpmEl) {
    liveWpmEl.textContent = wpmLive;
  }
}

/* ------------------------------------------------------------
   RENDERING DINAMICO DELLE 2 RIGHE
   - calcola quante parole stanno realmente nella larghezza
   - niente parole tagliate o nascoste
------------------------------------------------------------ */
function renderWord(globalIndex, w) {
  let extraCls = "";
  const res = resultsHistory[globalIndex];

  if (res) {
    extraCls += res.ok ? " done-correct" : " done-wrong";
  }
  if (globalIndex === cursorIndex) {
    extraCls += " current";
  }

  return `<span class="word${extraCls}" data-idx="${globalIndex}">${w}</span>`;
}

// riempie una riga a partire da startIndex fino a che non supera la larghezza
function fillRow(startIndex, container) {
  ensureWords();

  let html = "";
  let count = 0;

  while (true) {
    const idx = startIndex + count;
    const w = wordsStream[idx];
    if (!w) break;

    const candidate =
      count === 0
        ? renderWord(idx, w)
        : html + " " + renderWord(idx, w);

    container.innerHTML = candidate;

    // se abbiamo almeno una parola e ora sfora, fermati
    if (container.scrollWidth > container.clientWidth && count > 0) {
      break;
    }

    html = candidate;
    count++;

    if (count > 60) break; // safety
  }

  container.innerHTML = html;
  return count;
}

function renderLines() {
  ensureWords();

  row1Count = fillRow(offsetIndex, row1El);
  row2Count = fillRow(offsetIndex + row1Count, row2El);

  applyLiveHighlight();
}

/* ------------------------------------------------------------
   LIVE HIGHLIGHT LETTERA PER LETTERA
------------------------------------------------------------ */
function applyLiveHighlight() {
  const currentWord = wordsStream[cursorIndex] || "";
  const rawTyped = inputEl.value || "";
  const typed = rawTyped.replace(/\s+/g, "");

  const span = document.querySelector(`.word.current[data-idx="${cursorIndex}"]`);
  if (!span) return;

  if (typed.length === 0) {
    span.textContent = currentWord;
    return;
  }

  let html = "";
  for (let i = 0; i < currentWord.length; i++) {
    const targetChar = currentWord[i] || "";
    const typedChar = typed[i];

    if (typedChar == null) {
      html += `<span class="char-neutral">${targetChar}</span>`;
    } else if (typedChar === targetChar) {
      html += `<span class="char-correct">${targetChar}</span>`;
    } else {
      html += `<span class="char-wrong">${targetChar}</span>`;
    }
  }

  span.innerHTML = html;
}

/* ------------------------------------------------------------
   KEYBOARD HIGHLIGHT
------------------------------------------------------------ */
function activateKey(letter) {
  const k = document.querySelector(`.key[data-key="${letter}"]`);
  if (!k) return;
  k.classList.add("active");
  setTimeout(() => k.classList.remove("active"), 120);
}

/* ------------------------------------------------------------
   TIMER
------------------------------------------------------------ */
function startTest() {
  if (active) return;
  active = true;

  testDuration = parseInt(durationEl.value, 10);
  timeLeft = testDuration;
  updateHUD();

  timer = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      timeLeft = 0;
      updateHUD();
      endTest();
    } else {
      updateHUD();
    }
  }, 1000);
}

/* ------------------------------------------------------------
   END TEST
------------------------------------------------------------ */
async function endTest() {
  if (!active && timeLeft === 0 && timer === null) return;

  active = false;
  clearInterval(timer);
  timer = null;

  const total = correct + incorrect;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const minutes = testDuration / 60;
  const wpm = Math.round(correct / minutes);
  const cpm = Math.round(charsTyped / minutes);

  const session = {
    wpm,
    cpm,
    accuracy,
    duration: testDuration,
    mode: modeEl.value
  };

  await saveToServer(session);

  wpmFinalEl.textContent = wpm;
  cpmFinalEl.textContent = cpm;
  accuracyFinalEl.textContent = accuracy + "%";

  pbFinalEl.textContent = wpm;
  pbValue.textContent = wpm;

  const sortedKeys = Object.entries(pressedKeys)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  problemKeysEl.innerHTML =
    sortedKeys.length > 0
      ? sortedKeys.map(k => `<code>${k[0]}</code>: ${k[1]}`).join(" — ")
      : "–";

  fingerTipsEl.textContent = createFingerFeedback();

  overlay.classList.remove("hidden");
}

/* ------------------------------------------------------------
   ERRORI PER DITA
------------------------------------------------------------ */
function createFingerFeedback() {
  const f = fingerErrors;
  const arr = [];

  if (f.leftPinky) arr.push(`mignolo SX: ${f.leftPinky}`);
  if (f.leftRing)  arr.push(`anulare SX: ${f.leftRing}`);
  if (f.rightRing) arr.push(`anulare DX: ${f.rightRing}`);
  if (f.rightPinky)arr.push(`mignolo DX: ${f.rightPinky}`);

  return arr.length ? arr.join(" — ") : "nessun problema evidente";
}

function registerFingerError(letter) {
  const c = letter.toLowerCase();
  if ("qaz".includes(c)) fingerErrors.leftPinky++;
  if ("wsx".includes(c)) fingerErrors.leftRing++;
  if ("olm".includes(c)) fingerErrors.rightRing++;
  if ("pòù".includes(c)) fingerErrors.rightPinky++;
}

/* ------------------------------------------------------------
   CHECK WORD (spazio / invio)
------------------------------------------------------------ */
function checkWord() {
  const typed = inputEl.value.trim();
  if (!typed) return;

  const target = wordsStream[cursorIndex];
  const ok = typed === target;

  if (ok) correct++;
  else {
    incorrect++;
    for (let c of typed) {
      pressedKeys[c] = (pressedKeys[c] || 0) + 1;
      registerFingerError(c);
    }
  }

  charsTyped += typed.length;
  resultsHistory[cursorIndex] = { word: target, ok };

  cursorIndex++;

  // se la parola corrente supera la riga 1 → la riga 2 sale
  if (cursorIndex >= offsetIndex + row1Count) {
    offsetIndex += row1Count;
  }

  inputEl.value = "";
  renderLines();
  updateHUD();
}

/* ------------------------------------------------------------
   INPUT EVENTS
------------------------------------------------------------ */
function handleKeyDown(e) {
  if (!active) startTest();

  if (e.key.length === 1) {
    activateKey(e.key.toLowerCase());
  }

  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    checkWord();
  }
}

function handleInputEvent() {
  applyLiveHighlight();
}

/* ------------------------------------------------------------
   RESET
------------------------------------------------------------ */
function resetAll() {
  active = false;
  clearInterval(timer);
  timer = null;

  wordsStream = [];
  resultsHistory = [];

  cursorIndex = 0;
  offsetIndex = 0;
  row1Count = 0;
  row2Count = 0;

  correct = 0;
  incorrect = 0;
  charsTyped = 0;

  pressedKeys = {};
  fingerErrors = {
    leftPinky: 0,
    leftRing: 0,
    rightRing: 0,
    rightPinky: 0
  };

  inputEl.value = "";

  testDuration = parseInt(durationEl.value, 10);
  timeLeft = testDuration;

  ensureWords();
  renderLines();
  updateHUD();
}

/* ------------------------------------------------------------
   EVENTS
------------------------------------------------------------ */
inputEl.addEventListener("keydown", handleKeyDown);
inputEl.addEventListener("input", handleInputEvent);

closeOverlayBtn.addEventListener("click", () => {
  overlay.classList.add("hidden");
  resetAll();
});

// cambio modalità → rigenero completamente lo stream
modeEl.addEventListener("change", () => {
  resetAll();
});

/* ------------------------------------------------------------
   INIT
------------------------------------------------------------ */
resetAll();
