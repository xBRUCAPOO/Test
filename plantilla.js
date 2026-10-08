/* =========================================================
   TEST — script.js
   Lógica de la app de tests multiple choice.
   ========================================================= */

/* =========================================================
   1) CONFIGURACIÓN Y PREGUNTAS  (ÚNICA ZONA QUE SE EDITA)
   ---------------------------------------------------------
   Cada pregunta del array QUESTIONS tiene este formato:
   {
     pregunta: "Texto de la pregunta",
     opciones: ["Opción A", "Opción B", "Opción C", "Opción D"],
     correcta: 0   // posición de la opción correcta (0 = A, 1 = B, 2 = C, 3 = D...)
   }
   Se puede usar de 2 a 26 opciones por pregunta.
   El puntaje final siempre se calcula sobre 10, sin importar cuántas preguntas haya.
   ========================================================= */

// Título y tema que se muestran en la pantalla de inicio
const TEST_CONFIG = {
  titulo: "Test", // Título grande de la pantalla de inicio
  tema: ""        // Subtítulo opcional (ej: "Historia Argentina"). Vacío = no se muestra
};

// Banco de preguntas: vacío a propósito, se completa cuando se necesite
const QUESTIONS = [
  /* Ejemplo (borrar los comentarios para usarlo):
  {
    pregunta: "¿Cuál es la capital de Argentina?",
    opciones: ["Córdoba", "Buenos Aires", "Rosario", "Mendoza"],
    correcta: 1
  },
  */
];

/* =========================================================
   2) CONSTANTES Y ESTADO
   ========================================================= */

const MAX_SCORE = 10;                 // Puntaje máximo del test
const RING_LENGTH = 2 * Math.PI * 52; // Circunferencia del aro de puntaje (coincide con style.css)

// Atajo para obtener elementos por id
const $ = (id) => document.getElementById(id);

// Referencias a los elementos del DOM que se usan en toda la app
const els = {
  screenStart: $("screenStart"),
  screenQuiz: $("screenQuiz"),
  mainTitle: $("mainTitle"),
  testTopic: $("testTopic"),
  statCount: $("statCount"),
  emptyNotice: $("emptyNotice"),
  btnStart: $("btnStart"),
  topTag: $("topTag"),
  qCounter: $("qCounter"),
  progressBar: $("progressBar"),
  qCard: $("qCard"),
  qText: $("qText"),
  options: $("options"),
  btnPrev: $("btnPrev"),
  btnNext: $("btnNext"),
  btnNextLabel: $("btnNextLabel"),
  btnNextIcon: $("btnNextIcon"),
  float: $("resultFloat"),
  scoreBox: $("scoreBox"), // [v1.1.0] contenedor del puntaje (recibe el tono de color)
  scoreBar: $("scoreBar"),
  scoreValue: $("scoreValue"),
  scoreMsg: $("scoreMsg"),
  scoreMeta: $("scoreMeta"),
  reviewList: $("reviewList"),
  btnHome: $("btnHome"),
  btnRetry: $("btnRetry")
};

let questions = [];     // Preguntas válidas (ya filtradas)
let current = 0;        // Índice de la pregunta actual
let answers = [];       // Respuesta elegida por pregunta (null = sin responder)
let quizActive = false; // true mientras se está resolviendo el test

/* =========================================================
   3) UTILIDADES
   ========================================================= */

// Agrega un 0 adelante: 3 -> "03" (para el contador 01 / 10)
const pad = (n) => String(n).padStart(2, "0");

// Muestra el puntaje sin decimales si es entero (7) o con 1 decimal (6.7)
const formatScore = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

// Curva de suavizado para la animación de conteo del puntaje
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// Cambia el texto de la etiqueta de estado de la barra superior
function setTag(text) {
  els.topTag.textContent = text;
}

// Muestra una pantalla y oculta la otra (reinicia la animación de entrada)
function showScreen(screen) {
  [els.screenStart, els.screenQuiz].forEach((s) => s.classList.remove("screen--active"));
  screen.classList.add("screen--active");
}

// Filtra preguntas mal armadas y avisa por consola cuál falló
function sanitizeQuestions(raw) {
  const valid = [];
  raw.forEach((q, i) => {
    const ok =
      q &&
      typeof q.pregunta === "string" && q.pregunta.trim() !== "" &&
      Array.isArray(q.opciones) && q.opciones.length >= 2 && q.opciones.length <= 26 &&
      Number.isInteger(q.correcta) && q.correcta >= 0 && q.correcta < q.opciones.length;
    if (ok) {
      valid.push(q);
    } else {
      console.warn(`[Test] La pregunta #${i + 1} está mal armada y se omitió.`, q);
    }
  });
  return valid;
}

/* =========================================================
   4) PANTALLA DE INICIO
   ========================================================= */

// Arma el título letra por letra para la animación de entrada escalonada
function renderTitle() {
  els.mainTitle.textContent = "";
  els.mainTitle.setAttribute("aria-label", TEST_CONFIG.titulo);
  [...TEST_CONFIG.titulo].forEach((ch, i) => {
    const span = document.createElement("span");
    span.className = "title__char";
    span.setAttribute("aria-hidden", "true");
    span.textContent = ch === " " ? "\u00A0" : ch;
    span.style.animationDelay = `${i * 90}ms`;
    els.mainTitle.appendChild(span);
  });
  document.title = TEST_CONFIG.titulo;
}

// Prepara la pantalla de inicio: título, tema, contador y estado del botón
function setupStart() {
  renderTitle();
  els.testTopic.textContent = TEST_CONFIG.tema;
  els.statCount.textContent = questions.length;

  const empty = questions.length === 0;
  els.emptyNotice.hidden = !empty;   // Muestra el aviso si no hay preguntas
  els.btnStart.disabled = empty;     // No se puede comenzar sin preguntas
  setTag("LISTO");
}

/* =========================================================
   5) TEST (preguntas y navegación)
   ========================================================= */

// Comienza (o reinicia) el test desde la primera pregunta
function startTest() {
  if (questions.length === 0) return;
  current = 0;
  answers = new Array(questions.length).fill(null);
  quizActive = true;
  setTag("EN CURSO");
  showScreen(els.screenQuiz);
  renderQuestion();
}

// Dibuja la pregunta actual con sus opciones
function renderQuestion() {
  const q = questions[current];

  els.qCounter.textContent = `${pad(current + 1)} / ${pad(questions.length)}`;
  els.progressBar.style.width = `${((current + 1) / questions.length) * 100}%`;
  els.qText.textContent = q.pregunta; // textContent evita que el texto se interprete como HTML

  els.options.textContent = "";
  q.opciones.forEach((texto, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", String(answers[current] === i));
    btn.style.animationDelay = `${i * 70}ms`;
    if (answers[current] === i) btn.classList.add("option--selected");

    const letter = document.createElement("span");
    letter.className = "option__letter";
    letter.textContent = String.fromCharCode(65 + i); // A, B, C, D...

    const label = document.createElement("span");
    label.className = "option__text";
    label.textContent = texto;

    btn.append(letter, label);
    btn.addEventListener("click", () => selectOption(i));
    els.options.appendChild(btn);
  });

  // Reinicia la animación de entrada de la tarjeta en cada pregunta
  els.qCard.classList.remove("qcard--in");
  void els.qCard.offsetWidth;
  els.qCard.classList.add("qcard--in");

  els.btnPrev.disabled = current === 0;
  updateNext();
}

// Guarda la opción elegida y la resalta (se puede cambiar antes de avanzar)
function selectOption(i) {
  answers[current] = i;
  [...els.options.children].forEach((btn, idx) => {
    const selected = idx === i;
    btn.classList.toggle("option--selected", selected);
    btn.setAttribute("aria-checked", String(selected));
  });
  updateNext();
}

// Habilita "Siguiente" solo si hay respuesta; en la última pregunta cambia a "Finalizar"
function updateNext() {
  const isLast = current === questions.length - 1;
  els.btnNext.disabled = answers[current] === null;
  els.btnNextLabel.textContent = isLast ? "Finalizar" : "Siguiente";
  els.btnNextIcon.textContent = isLast ? "flag" : "arrow_forward";
}

// Avanza a la siguiente pregunta o termina el test
function goNext() {
  if (answers[current] === null) return;
  if (current < questions.length - 1) {
    current++;
    renderQuestion();
  } else {
    finishTest();
  }
}

// Vuelve a la pregunta anterior (conserva la respuesta ya elegida)
function goPrev() {
  if (current === 0) return;
  current--;
  renderQuestion();
}

/* =========================================================
   6) RESULTADOS (float con puntaje /10 y revisión)
   ========================================================= */

// Calcula la nota y abre el float de resultados
function finishTest() {
  quizActive = false;
  setTag("FINALIZADO");

  const correct = questions.reduce((acc, q, i) => acc + (answers[i] === q.correcta ? 1 : 0), 0);
  const score = Math.round((correct / questions.length) * MAX_SCORE * 10) / 10; // sobre 10, 1 decimal

  buildReview();
  showFloat(score, correct);
}

// Devuelve un mensaje según la nota
function scoreMessage(score) {
  if (score >= 10) return "¡Perfecto!";
  if (score >= 9) return "¡Excelente!";
  if (score >= 7) return "Muy bien";
  if (score >= 6) return "Aprobado";
  if (score >= 4) return "Hay que repasar";
  return "Seguí practicando";
}

// [v1.1.0] Devuelve el tono de color de la nota (success / warning / error) para pintar el aro y el mensaje
function scoreTone(score) {
  if (score >= 6) return "success"; // aprobado
  if (score >= 4) return "warning"; // hay que repasar
  return "error";                   // desaprobado
}

// Crea un icono de Material Symbols
function icon(name) {
  const s = document.createElement("span");
  s.className = "material-symbols-outlined";
  s.textContent = name;
  return s;
}

// [v1.1.0] Crea una línea de respuesta ("Tu respuesta" / "Correcta") según el tono:
// "ok" = verde (success), "bad" = rojo (error), "skip" = amarillo (warning, sin responder)
function answerLine(label, texto, tone) {
  const row = document.createElement("div");
  row.className = `review__ans review__ans--${tone}`;

  const body = document.createElement("span");
  const tag = document.createElement("span");
  tag.className = "review__label";
  tag.textContent = label;
  body.append(tag, document.createTextNode(texto));

  const iconName = tone === "ok" ? "check" : tone === "bad" ? "close" : "remove";
  row.append(icon(iconName), body);
  return row;
}

// Arma la lista con todas las preguntas y las respuestas elegidas (verde = bien, rojo = mal)
function buildReview() {
  els.reviewList.textContent = "";

  questions.forEach((q, i) => {
    const chosen = answers[i];
    const ok = chosen === q.correcta;
    const skipped = chosen === null;                        // [v1.1.0] pregunta sin responder
    const tone = ok ? "ok" : skipped ? "skip" : "bad";      // [v1.1.0] tono: verde / amarillo / rojo

    const item = document.createElement("li");
    item.className = `review__item review__item--${tone}`;
    item.style.animationDelay = `${i * 60}ms`;

    // Cabecera: número, pregunta e icono de estado
    const head = document.createElement("div");
    head.className = "review__head";

    const num = document.createElement("span");
    num.className = "review__num";
    num.textContent = pad(i + 1);

    const qText = document.createElement("span");
    qText.className = "review__q";
    qText.textContent = q.pregunta;

    const status = icon(ok ? "check_circle" : skipped ? "help" : "cancel");
    status.classList.add("review__status");

    head.append(num, qText, status);
    item.appendChild(head);

    // Respuesta elegida (verde si acertó, roja si falló, amarilla si quedó sin responder)
    const chosenText = skipped ? "Sin responder" : q.opciones[chosen];
    item.appendChild(answerLine("Tu respuesta", chosenText, tone));

    // Si no acertó, también se muestra la correcta en verde
    if (!ok) item.appendChild(answerLine("Correcta", q.opciones[q.correcta], "ok"));

    els.reviewList.appendChild(item);
  });
}

// Abre el float y anima el puntaje (conteo + aro)
function showFloat(score, correct) {
  els.scoreMsg.textContent = scoreMessage(score);
  els.scoreBox.dataset.tone = scoreTone(score); // [v1.1.0] el CSS pinta aro y mensaje según este tono
  els.scoreMeta.textContent = `${correct} de ${questions.length} correctas`;
  els.scoreValue.textContent = "0";
  els.scoreBar.style.strokeDashoffset = RING_LENGTH; // aro vacío antes de animar

  els.float.hidden = false;
  document.body.classList.add("no-scroll");
  els.float.querySelector(".float__body").scrollTop = 0;
  els.btnRetry.focus({ preventScroll: true });

  // Aro: se llena con la transición CSS (esperamos 2 frames para que arranque desde vacío)
  requestAnimationFrame(() => requestAnimationFrame(() => {
    els.scoreBar.style.strokeDashoffset = RING_LENGTH * (1 - score / MAX_SCORE);
  }));

  // Número: cuenta de 0 hasta la nota
  const duration = 1400;
  const t0 = performance.now();
  const tick = (now) => {
    const p = Math.min((now - t0) / duration, 1);
    const value = score * easeOutCubic(p);
    els.scoreValue.textContent = p < 1 ? formatScore(Math.round(value * 10) / 10) : formatScore(score);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Cierra el float
function hideFloat() {
  els.float.hidden = true;
  document.body.classList.remove("no-scroll");
}

// "Reintentar": cierra el float y empieza de nuevo
function retry() {
  hideFloat();
  startTest();
}

// "Inicio": cierra el float y vuelve a la pantalla inicial
function goHome() {
  hideFloat();
  quizActive = false;
  setupStart();
  showScreen(els.screenStart);
}

/* =========================================================
   7) EVENTOS
   ========================================================= */

els.btnStart.addEventListener("click", startTest);
els.btnPrev.addEventListener("click", goPrev);
els.btnNext.addEventListener("click", goNext);
els.btnRetry.addEventListener("click", retry);
els.btnHome.addEventListener("click", goHome);

// Atajos de teclado durante el test: A-Z o 1-9 eligen opción, flechas navegan
document.addEventListener("keydown", (e) => {
  if (!quizActive || e.ctrlKey || e.metaKey || e.altKey) return;

  const key = e.key.toLowerCase();
  const q = questions[current];

  if (e.key === "ArrowLeft") { goPrev(); return; }
  if (e.key === "ArrowRight") { goNext(); return; }

  let idx = -1;
  if (/^[a-z]$/.test(key)) idx = key.charCodeAt(0) - 97; // a=0, b=1...
  else if (/^[1-9]$/.test(key)) idx = Number(key) - 1;   // 1=0, 2=1...

  if (idx >= 0 && idx < q.opciones.length) selectOption(idx);
});

/* =========================================================
   8) INICIO DE LA APP
   ========================================================= */

questions = sanitizeQuestions(QUESTIONS);
setupStart();
 