/* =========================================================
   TEST — script.js  (v1.3.0)
   Lógica de la app de tests multiple choice.

   CÓMO AGREGAR UN TEST (las preguntas ya NO se escriben acá):
   1) Crear un archivo .json dentro de la carpeta  tests/  (ver tests/plantilla.json).
   2) Agregar el nombre del archivo a la lista de  tests/index.json.
   Al entrar a la página aparece un menú con todos los tests listados;
   el nombre que se ve en el menú sale del campo "nombre" de cada JSON.

   Formato de cada JSON:
   {
     "nombre": "Historia Argentina",          // nombre que se ve en el menú (si falta, se usa el del archivo)
     "tema": "Texto opcional bajo el nombre",  // opcional
     "preguntas": [
       {
         "pregunta": "Texto de la pregunta",
         "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
         "correcta": 1,                        // posición de la correcta (0 = A, 1 = B, 2 = C...)
         "tema": "Subtema que se evalúa",      // [v1.3.0] opcional: texto pequeño gris arriba de la pregunta (se toma por pregunta)
         "descripcion": "Por qué es correcta"  // opcional: se muestra SOLO en los resultados, bajo una respuesta incorrecta
       }
     ]
   }
   Se puede usar de 2 a 26 opciones por pregunta.
   El puntaje final siempre se calcula sobre 10, sin importar cuántas preguntas haya.
   [v1.3.0] El test se puede terminar en cualquier momento con "Terminar test". Si quedan preguntas sin contestar,
   los resultados muestran "Incompleto" y 2 promedios: General (las sin contestar suman 0) y Contestadas (solo las respondidas).
   [v1.3.0] "Anterior" solo permite volver hasta 2 preguntas por detrás de la más lejana a la que se llegó.
   ========================================================= */

/* =========================================================
   1) CONSTANTES Y ESTADO
   ========================================================= */

const TESTS_DIR = "tests/";               // [v1.2.0] carpeta donde viven los JSON de preguntas
const INDEX_URL = TESTS_DIR + "index.json"; // [v1.2.0] lista de archivos de test disponibles
const MAX_SCORE = 10;                     // Puntaje máximo del test
const MAX_BACK = 2;                       // [v1.3.0] cuántas preguntas se puede volver con "Anterior" (respecto de la más lejana alcanzada)
const RING_LENGTH = 2 * Math.PI * 52;     // Circunferencia del aro de puntaje (coincide con style.css)

// Atajo para obtener elementos por id
const $ = (id) => document.getElementById(id);

// Referencias a los elementos del DOM que se usan en toda la app
const els = {
  screenMenu: $("screenMenu"),           // [v1.2.0] pantalla del menú de tests
  menuTitle: $("menuTitle"),
  menuNotice: $("menuNotice"),
  menuNoticeIcon: $("menuNoticeIcon"),
  menuNoticeText: $("menuNoticeText"),
  menuList: $("menuList"),
  screenStart: $("screenStart"),
  screenQuiz: $("screenQuiz"),
  mainTitle: $("mainTitle"),
  testTopic: $("testTopic"),
  statCount: $("statCount"),
  btnStart: $("btnStart"),
  btnChange: $("btnChange"),             // [v1.2.0] "Cambiar test": vuelve al menú
  topTag: $("topTag"),
  qCounter: $("qCounter"),
  progressBar: $("progressBar"),
  qCard: $("qCard"),
  qTopic: $("qTopic"),                   // [v1.3.0] tema de la pregunta (texto pequeño gris)
  qText: $("qText"),
  options: $("options"),
  btnPrev: $("btnPrev"),
  btnFinish: $("btnFinish"),             // [v1.3.0] "Terminar test": cierra el test en cualquier momento
  btnNext: $("btnNext"),
  btnNextLabel: $("btnNextLabel"),
  btnNextIcon: $("btnNextIcon"),
  float: $("resultFloat"),
  scoreBox: $("scoreBox"),               // contenedor del puntaje (recibe el tono de color)
  scoreBar: $("scoreBar"),
  scoreValue: $("scoreValue"),
  scoreMsg: $("scoreMsg"),
  scoreMeta: $("scoreMeta"),
  scoreIncomplete: $("scoreIncomplete"), // [v1.3.0] texto "Incompleto" (naranja)
  scoreAvgs: $("scoreAvgs"),             // [v1.3.0] contenedor de los 2 promedios
  avgAll: $("avgAll"),                   // [v1.3.0] promedio general (todas las preguntas)
  avgAnswered: $("avgAnswered"),         // [v1.3.0] promedio solo de las contestadas
  reviewList: $("reviewList"),
  btnHome: $("btnHome"),
  btnRetry: $("btnRetry")
};

let catalog = [];       // [v1.2.0] tests cargados desde los JSON: { file, nombre, tema, preguntas }
let currentTest = null; // [v1.2.0] test elegido en el menú
let questions = [];     // Preguntas del test elegido (ya validadas)
let current = 0;        // Índice de la pregunta actual
let answers = [];       // Respuesta elegida por pregunta (null = sin responder)
let quizActive = false; // true mientras se está resolviendo el test
let maxReached = 0;     // [v1.3.0] índice de la pregunta más lejana a la que se llegó (límite para "Anterior")

/* =========================================================
   2) UTILIDADES
   ========================================================= */

// Agrega un 0 adelante: 3 -> "03" (para el contador 01 / 10)
const pad = (n) => String(n).padStart(2, "0");

// Muestra el puntaje sin decimales si es entero (7) o con 1 decimal (6.7)
const formatScore = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

// [v1.3.0] Nota sobre 10 con 1 decimal: aciertos / base. La base es el total de preguntas (promedio general)
// o solo las contestadas (promedio de contestadas)
const calcScore = (correct, base) => Math.round((correct / base) * MAX_SCORE * 10) / 10;

// [v1.3.0] Índice más bajo al que se puede volver: hasta MAX_BACK preguntas por detrás de la más lejana alcanzada
const minAllowedIndex = () => Math.max(0, maxReached - MAX_BACK);

// Curva de suavizado para la animación de conteo del puntaje
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// Cambia el texto de la etiqueta de estado de la barra superior
function setTag(text) {
  els.topTag.textContent = text;
}

// Crea un icono de Material Symbols
function icon(name) {
  const s = document.createElement("span");
  s.className = "material-symbols-outlined";
  s.textContent = name;
  return s;
}

// Muestra una pantalla y oculta las demás (reinicia la animación de entrada)
// [v1.2.0] Ahora son 3 pantallas (menú, inicio del test, test) y sube al tope de la página (útil en celular)
function showScreen(screen) {
  [els.screenMenu, els.screenStart, els.screenQuiz].forEach((s) => s.classList.remove("screen--active"));
  screen.classList.add("screen--active");
  window.scrollTo(0, 0);
}

// [v1.2.0] Arma un título letra por letra para la animación de entrada escalonada.
// Las letras se agrupan por palabra para que en celular el título parta línea entre palabras y no se salga de la pantalla.
function renderTitle(el, texto) {
  el.textContent = "";
  el.setAttribute("aria-label", texto);
  el.classList.toggle("title--long", texto.length > 14); // títulos largos usan una tipografía más chica
  let i = 0;
  texto.split(" ").forEach((palabra, w, arr) => {
    const word = document.createElement("span");
    word.className = "title__word";
    [...palabra].forEach((ch) => {
      const span = document.createElement("span");
      span.className = "title__char";
      span.setAttribute("aria-hidden", "true");
      span.textContent = ch;
      span.style.animationDelay = `${i++ * 60}ms`;
      word.appendChild(span);
    });
    el.appendChild(word);
    if (w < arr.length - 1) el.appendChild(document.createTextNode(" ")); // espacio real: permite el salto de línea
  });
}

/* =========================================================
   3) CARGA DE TESTS DESDE JSON  [v1.2.0]
   ========================================================= */

// Lee un JSON por fetch (no-cache: si se edita un test, se ve el cambio al recargar)
async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Filtra preguntas mal armadas, avisa por consola cuál falló y normaliza la descripción opcional
function sanitizeQuestions(raw, origen) {
  const valid = [];
  raw.forEach((q, i) => {
    const ok =
      q &&
      typeof q.pregunta === "string" && q.pregunta.trim() !== "" &&
      Array.isArray(q.opciones) && q.opciones.length >= 2 && q.opciones.length <= 26 &&
      Number.isInteger(q.correcta) && q.correcta >= 0 && q.correcta < q.opciones.length;
    if (ok) {
      valid.push({
        pregunta: q.pregunta,
        opciones: q.opciones.map(String),
        correcta: q.correcta,
        // [v1.3.0] Tema opcional de la pregunta: se muestra en gris arriba de la pregunta mientras se resuelve
        tema: typeof q.tema === "string" ? q.tema.trim() : "",
        // Descripción opcional: se muestra solo en los resultados, bajo una respuesta incorrecta
        descripcion: typeof q.descripcion === "string" ? q.descripcion.trim() : ""
      });
    } else {
      console.warn(`[Test] ${origen}: la pregunta #${i + 1} está mal armada y se omitió.`, q);
    }
  });
  return valid;
}

// Valida el contenido de un JSON de test y lo convierte al formato interno
function parseTest(file, data) {
  if (!data || !Array.isArray(data.preguntas)) throw new Error("falta el array \"preguntas\"");
  const preguntas = sanitizeQuestions(data.preguntas, file);
  if (preguntas.length === 0) throw new Error("no tiene preguntas válidas");
  return {
    file,
    nombre: typeof data.nombre === "string" && data.nombre.trim() ? data.nombre.trim() : file.replace(/\.json$/i, ""),
    tema: typeof data.tema === "string" ? data.tema.trim() : "",
    preguntas
  };
}

// Muestra un aviso en el menú. tono: "info" | "warning" | "error"
function setNotice(tono, iconName, texto) {
  els.menuNotice.hidden = false;
  els.menuNotice.className = `notice notice--${tono}`;
  els.menuNoticeIcon.textContent = iconName;
  els.menuNoticeText.textContent = texto;
}
// Lee tests/index.json, carga cada test listado y dibuja el menú
async function loadCatalog() {
  setNotice("info", "hourglass_top", "Cargando tests…");

  // 1) Lista de archivos (acepta ["a.json"] o { "tests": ["a.json"] })
  let files;
  try {
    const idx = await fetchJSON(INDEX_URL);
    files = Array.isArray(idx) ? idx : idx && idx.tests;
    if (!Array.isArray(files)) throw new Error("formato inválido");
  } catch (err) {
    console.error(`[Test] No se pudo leer ${INDEX_URL}`, err);
    setNotice(
      "error",
      "error",
      location.protocol === "file:"
        ? "El navegador no deja leer los JSON abriendo el archivo directo. Abrí la página desde un servidor (Cloudflare Pages o la extensión Live Server de VS Code)."
        : `No se pudo leer ${INDEX_URL}. Revisá que exista y que sea un JSON válido.`
    );
    return;
  }

  // Solo nombres de archivo simples dentro de tests/ (sin rutas hacia arriba)
  files = files.filter((f) => typeof f === "string" && f.trim() !== "" && !f.includes("..") && !f.startsWith("/"));
  if (files.length === 0) {
    setNotice("info", "info", "No hay tests cargados. Agregá un .json en la carpeta tests/ y listalo en tests/index.json.");
    return;
  }

  // 2) Cada test se carga en paralelo; si uno falla, los demás igual aparecen
  const results = await Promise.allSettled(
    files.map(async (f) => parseTest(f, await fetchJSON(TESTS_DIR + encodeURI(f))))
  );

  catalog = [];
  const failed = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      catalog.push(r.value);
    } else {
      failed.push(files[i]);
      console.warn(`[Test] No se pudo cargar ${files[i]}:`, r.reason);
    }
  });

  renderMenu();

  if (failed.length > 0) {
    setNotice("warning", "warning", `No se pudo cargar: ${failed.join(", ")}. Revisá que el JSON sea válido (el detalle está en la consola).`);
  } else {
    els.menuNotice.hidden = true;
  }
}

/* =========================================================
   4) MENÚ DE TESTS  [v1.2.0]
   ========================================================= */

// Dibuja una tarjeta por cada test cargado
function renderMenu() {
  els.menuList.textContent = "";

  catalog.forEach((t, i) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "test-card";
    card.style.animationDelay = `${i * 70}ms`;

    const iconBox = document.createElement("span");
    iconBox.className = "test-card__icon";
    iconBox.appendChild(icon("connected_tv"));

    const info = document.createElement("span");
    info.className = "test-card__info";

    const name = document.createElement("strong");
    name.className = "test-card__name";
    name.textContent = t.nombre;
    info.appendChild(name);

    if (t.tema) {
      const topic = document.createElement("span");
      topic.className = "test-card__topic";
      topic.textContent = t.tema;
      info.appendChild(topic);
    }

    const meta = document.createElement("small");
    meta.className = "test-card__meta";
    meta.textContent = `${t.preguntas.length} ${t.preguntas.length === 1 ? "pregunta" : "preguntas"}`;
    info.appendChild(meta);

    const chev = icon("chevron_right");
    chev.classList.add("test-card__chev");

    card.append(iconBox, info, chev);
    card.addEventListener("click", () => selectTest(t));
    els.menuList.appendChild(card);
  });
}

// Vuelve al menú de tests (desde "Cambiar test" o desde el float de resultados)
function showMenu() {
  hideFloat();
  quizActive = false;
  currentTest = null;
  questions = [];
  renderTitle(els.menuTitle, "Test");
  document.title = "Test";
  setTag("MENÚ");
  showScreen(els.screenMenu);
}

// Elige un test del menú y muestra su pantalla de inicio
function selectTest(t) {
  currentTest = t;
  questions = t.preguntas;
  setupStart();
  showScreen(els.screenStart);
}

/* =========================================================
   5) PANTALLA DE INICIO DEL TEST
   ========================================================= */

// Prepara la pantalla de inicio con los datos del test elegido
function setupStart() {
  renderTitle(els.mainTitle, currentTest.nombre);
  els.testTopic.textContent = currentTest.tema;
  els.statCount.textContent = questions.length;
  document.title = `${currentTest.nombre} · Test`;
  setTag("LISTO");
}

/* =========================================================
   6) TEST (preguntas y navegación)
   ========================================================= */

// Comienza (o reinicia) el test desde la primera pregunta
function startTest() {
  if (questions.length === 0) return;
  current = 0;
  maxReached = 0; // [v1.3.0] reinicia el límite de "Anterior"
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
  els.qTopic.textContent = q.tema;    // [v1.3.0] tema opcional: si está vacío, el CSS oculta el párrafo
  maxReached = Math.max(maxReached, current); // [v1.3.0] recuerda la pregunta más lejana alcanzada (límite de "Anterior")

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

  window.scrollTo(0, 0); // [v1.2.0] en celular, cada pregunta nueva arranca desde arriba

  els.btnPrev.disabled = current <= minAllowedIndex(); // [v1.3.0] solo se puede volver hasta 2 preguntas
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

// Vuelve a la pregunta anterior (conserva la respuesta ya elegida).
// [v1.3.0] Solo hasta MAX_BACK (2) preguntas por detrás de la más lejana alcanzada; también rige para la flecha izquierda del teclado
function goPrev() {
  if (current <= minAllowedIndex()) return;
  current--;
  renderQuestion();
}

/* =========================================================
   7) RESULTADOS (float con puntaje /10 y revisión)
   ========================================================= */

// Calcula las notas y abre el float de resultados.
// [v1.3.0] El test se puede terminar en cualquier momento ("Terminar test"): las preguntas sin contestar suman 0
// en el promedio general y no cuentan en el promedio de contestadas
function finishTest() {
  if (!quizActive) return; // evita terminar dos veces (por ejemplo, con un doble toque)
  quizActive = false;
  setTag("FINALIZADO");

  const total = questions.length;
  const correct = questions.reduce((acc, q, i) => acc + (answers[i] === q.correcta ? 1 : 0), 0);
  const answered = answers.filter((a) => a !== null).length;   // preguntas contestadas
  const incomplete = answered < total;                         // true si quedó alguna sin contestar
  const scoreAll = calcScore(correct, total);                  // promedio general: las sin contestar suman 0
  const scoreAnswered = answered > 0 ? calcScore(correct, answered) : null; // solo contestadas (null si no contestó ninguna)

  buildReview();
  showFloat({ scoreAll, scoreAnswered, correct, answered, total, incomplete });
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

// Devuelve el tono de color de la nota (success / warning / error) para pintar el aro y el mensaje
function scoreTone(score) {
  if (score >= 6) return "success"; // aprobado
  if (score >= 4) return "warning"; // hay que repasar
  return "error";                   // desaprobado
}

// Crea una línea de respuesta ("Tu respuesta" / "Correcta") según el tono:
// "ok" = verde (success), "bad" = rojo (error), "skip" = gris (sin responder) [v1.3.0: antes amarillo]
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

// [v1.2.0] Crea el bloque de descripción que explica por qué la correcta es la correcta ([v1.3.0] ahora en gris)
function descriptionBlock(texto) {
  const box = document.createElement("div");
  box.className = "review__desc";

  const body = document.createElement("span");
  const tag = document.createElement("span");
  tag.className = "review__label";
  tag.textContent = "Explicación";
  body.append(tag, document.createTextNode(texto));

  box.append(icon("lightbulb"), body);
  return box;
}

// Arma la lista con todas las preguntas y las respuestas elegidas (verde = bien, rojo = mal, gris = sin responder)
function buildReview() {
  els.reviewList.textContent = "";

  questions.forEach((q, i) => {
    const chosen = answers[i];
    const ok = chosen === q.correcta;
    const skipped = chosen === null;                    // pregunta sin responder
    const tone = ok ? "ok" : skipped ? "skip" : "bad";  // tono: verde / gris / rojo

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

    // Respuesta elegida (verde si acertó, roja si falló, gris si quedó sin responder)
    const chosenText = skipped ? "Sin responder" : q.opciones[chosen];
    item.appendChild(answerLine("Tu respuesta", chosenText, tone));

    // Si no acertó, también se muestra la correcta en verde
    if (!ok) {
      item.appendChild(answerLine("Correcta", q.opciones[q.correcta], "ok"));
      // [v1.2.0] y, si la pregunta tiene descripción, la explicación debajo (solo cuando no se acertó)
      if (q.descripcion) item.appendChild(descriptionBlock(q.descripcion));
    }

    els.reviewList.appendChild(item);
  });
}

// Abre el float y anima el puntaje (conteo + aro)
// [v1.3.0] Recibe las dos notas: el aro, el conteo, el mensaje y el color usan la general (scoreAll).
// Si el test quedó incompleto se muestran además "Incompleto" (naranja) y los 2 promedios
function showFloat({ scoreAll, scoreAnswered, correct, answered, total, incomplete }) {
  const score = scoreAll; // el resto de la función (aro y conteo) trabaja con la nota general
  els.scoreMsg.textContent = scoreMessage(score);
  els.scoreBox.dataset.tone = scoreTone(score); // el CSS pinta aro y mensaje según este tono
  els.scoreIncomplete.hidden = !incomplete;
  els.scoreAvgs.hidden = !incomplete;
  els.avgAll.textContent = formatScore(scoreAll);
  els.avgAnswered.textContent = scoreAnswered === null ? "—" : formatScore(scoreAnswered); // "—" si no contestó ninguna
  els.scoreMeta.textContent = incomplete
    ? `${correct} de ${total} correctas · ${answered} contestadas`
    : `${correct} de ${total} correctas`;
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

// "Reintentar": cierra el float y empieza de nuevo el mismo test
function retry() {
  hideFloat();
  startTest();
}

/* =========================================================
   8) EVENTOS
   ========================================================= */

els.btnStart.addEventListener("click", startTest);
els.btnChange.addEventListener("click", showMenu); // [v1.2.0] "Cambiar test"
els.btnPrev.addEventListener("click", goPrev);
els.btnNext.addEventListener("click", goNext);
els.btnFinish.addEventListener("click", finishTest); // [v1.3.0] "Terminar test": cierra el test cuando se quiera
els.btnRetry.addEventListener("click", retry);
els.btnHome.addEventListener("click", showMenu);   // [v1.2.0] "Menú" del float: vuelve a elegir test

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
   9) INICIO DE LA APP
   ========================================================= */

renderTitle(els.menuTitle, "Test");
setTag("MENÚ");
loadCatalog(); // [v1.2.0] lee tests/index.json y arma el menú