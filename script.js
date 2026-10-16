/* =========================================================
   TEST — script.js  (v1.6.0)
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

   [v1.4.0] TIPOS DE PREGUNTA. El campo "tipo" es opcional: si no se pone, se detecta solo por la forma de la pregunta.
     • Normal (la de siempre)  → "tipo": "normal"    | lleva "opciones" y "correcta": 1 (posición de la correcta)
     • Verdadero o falso       → "tipo": "vf"        | NO lleva "opciones"; solo "correcta": true (o false)
     • Selección múltiple      → "tipo": "multiple"  | lleva "opciones" y "correctas": [0, 2] (posiciones de TODAS las correctas)
   Ejemplos:
     { "tipo": "vf", "pregunta": "El agua hierve a 100 °C a nivel del mar", "correcta": true }
     { "tipo": "multiple", "pregunta": "¿Cuáles son lenguajes de programación?", "opciones": ["Python", "HTML", "Java", "CSS"], "correctas": [0, 2] }
   "tema" y "descripcion" siguen siendo opcionales en los 3 tipos.
   PUNTAJE: normal y verdadero/falso valen 1 o 0. La selección múltiple da PUNTAJE PARCIAL: cada pregunta vale entre 0 y 1
   según (correctas marcadas − incorrectas marcadas) / total de correctas, con mínimo 0 (marcar todo no da puntos).
   El puntaje final siempre se calcula sobre 10, sin importar cuántas preguntas haya.
   [v1.3.0] El test se puede terminar en cualquier momento con "Terminar test". Si quedan preguntas sin contestar,
   los resultados muestran "Incompleto" y 2 promedios: General (las sin contestar suman 0) y Contestadas (solo las respondidas).
   [v1.3.0] "Anterior" solo permite volver hasta 2 preguntas por detrás de la más lejana a la que se llegó.
   [v1.5.0] La página se comporta como un formulario: si hay un test en curso, el navegador advierte
   antes de cerrar o recargar que el progreso puede perderse.
   [v1.5.0] "Terminar test" pide confirmación en una ventana flotante antes de actuar.
   [v1.5.0] Los resultados ocupan toda la pantalla; al scrollear las respuestas, el puntaje se minimiza
   en una barra compacta arriba de todo para no estorbar la revisión.
   [v1.5.1] En las preguntas de verdadero o falso, la opción elegida brilla según el valor:
   "Verdadero" en verde (success) y "Falso" en rojo (error), sin importar si la respuesta es correcta.
   [v1.5.2] "Anterior" ya no pide confirmación (vuelve a la pregunta anterior sin avisos). Para salir del test
   está la flecha "Volver", arriba a la izquierda de la pantalla del test: vuelve a la vista previa y, como
   sales del test, pide confirmación antes (el progreso de la vuelta se pierde).
   [v1.6.0] La app es una PWA: se puede instalar en el celular o el escritorio (manifest.json + íconos SVG) y
   funciona sin conexión gracias al service worker (sw.js), que guarda la app y los tests ya cargados.
   Al cambiar archivos, subir la versión de CACHE en sw.js para que los celulares actualicen.
   ========================================================= */

/* =========================================================
   1) CONSTANTES Y ESTADO
   ========================================================= */

const TESTS_DIR = "tests/";               // [v1.2.0] carpeta donde viven los JSON de preguntas
const INDEX_URL = TESTS_DIR + "index.json"; // [v1.2.0] lista de archivos de test disponibles
const MAX_SCORE = 10;                     // Puntaje máximo del test
const MAX_BACK = 2;                       // [v1.3.0] cuántas preguntas se puede volver con "Anterior" (respecto de la más lejana alcanzada)
const VF_OPCIONES = ["Verdadero", "Falso"]; // [v1.4.0] opciones fijas de las preguntas de verdadero o falso (posición 0 = Verdadero)
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
  qHint: $("qHint"),                     // [v1.4.0] aviso de selección múltiple ("Seleccioná todas las correctas")
  options: $("options"),
  btnBack: $("btnBack"),                 // [v1.5.2] flecha "Volver": sale del test y vuelve a la vista previa
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
  btnRetry: $("btnRetry"),
  // [v1.5.0] ventana flotante de confirmación (Anterior / Terminar test)
  confirmBox: $("confirmBox"),
  confirmIcon: $("confirmIcon"),
  confirmTitle: $("confirmTitle"),
  confirmText: $("confirmText"),
  confirmOk: $("confirmOk"),
  confirmCancel: $("confirmCancel"),
  // [v1.5.0] panel de resultados y su barra compacta de puntaje
  floatPanel: $("floatPanel"),
  floatBody: $("floatBody"),
  scoreMini: $("scoreMini"),
  miniValue: $("miniValue"),
  miniMsg: $("miniMsg"),
  miniIncomplete: $("miniIncomplete")
};

let catalog = [];       // [v1.2.0] tests cargados desde los JSON: { file, nombre, tema, preguntas }
let currentTest = null; // [v1.2.0] test elegido en el menú
let questions = [];     // Preguntas del test elegido (ya validadas)
let current = 0;        // Índice de la pregunta actual
let answers = [];       // [v1.4.0] Respuesta por pregunta: lista de posiciones elegidas (1 en normal y V/F, varias en múltiple); null = sin responder
let quizActive = false; // true mientras se está resolviendo el test
let maxReached = 0;     // [v1.3.0] índice de la pregunta más lejana a la que se llegó (límite para "Anterior")
let pendingConfirm = null; // [v1.5.0] función que espera la respuesta de la ventana de confirmación (null = cerrada)

/* =========================================================
   2) UTILIDADES
   ========================================================= */

// Agrega un 0 adelante: 3 -> "03" (para el contador 01 / 10)
const pad = (n) => String(n).padStart(2, "0");

// Muestra el puntaje sin decimales si es entero (7) o con 1 decimal (6.7)
const formatScore = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

// [v1.3.0] Nota sobre 10 con 1 decimal: puntos / base. La base es el total de preguntas (promedio general)
// o solo las contestadas (promedio de contestadas). [v1.4.0] "points" puede ser fraccionario por el puntaje parcial
const calcScore = (points, base) => Math.round((points / base) * MAX_SCORE * 10) / 10;

// [v1.4.0] Cuánto vale la respuesta a una pregunta, de 0 a 1:
//  • Normal y verdadero/falso: 1 si acertó, 0 si no.
//  • Selección múltiple: puntaje parcial = (correctas marcadas − incorrectas marcadas) / total de correctas, con mínimo 0
//    (así marcar todas las opciones no da puntos). Con una sola correcta la fórmula también da 1 o 0.
function questionCredit(q, ans) {
  if (!ans || ans.length === 0) return 0;
  const hits = ans.filter((i) => q.correctas.includes(i)).length; // correctas marcadas
  const wrong = ans.length - hits;                                // incorrectas marcadas
  return Math.max(0, (hits - wrong) / q.correctas.length);
}

// [v1.4.0] Formatea puntos, que pueden ser fraccionarios: 3 -> "3", 2.6667 -> "2.67"
const formatPoints = (v) => String(Math.round(v * 100) / 100);

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

// [v1.4.0] Detecta el tipo de pregunta. Si el JSON trae "tipo" se usa ese (acepta "normal", "vf" / "verdadero_falso" /
// "verdadero o falso", "multiple" / "seleccion multiple", sin importar mayúsculas ni tildes); si no lo trae, se deduce por la forma:
// "correctas" (lista) = múltiple, "correcta" true/false = verdadero o falso, cualquier otra cosa = normal.
// Devuelve null si el tipo escrito no se reconoce (la pregunta se omite con un aviso por consola)
function detectType(q) {
  if (typeof q.tipo === "string" && q.tipo.trim() !== "") {
    const t = q.tipo.toLowerCase().normalize("NFD").replace(/[̀-ͯ\s_-]/g, ""); // sin tildes, espacios ni guiones
    if (t === "vf" || t.startsWith("verdadero")) return "vf";
    if (t.startsWith("multi") || t.startsWith("seleccionmultiple")) return "multiple";
    if (t === "normal") return "normal";
    return null;
  }
  if (Array.isArray(q.correctas)) return "multiple";
  if (typeof q.correcta === "boolean") return "vf";
  return "normal";
}

// [v1.4.0] Valida una pregunta según su tipo y la convierte al formato interno:
// { tipo, pregunta, opciones, correctas: [posiciones correctas], letras, tema, descripcion }.
// Devuelve null si está mal armada. Todos los tipos quedan con la misma forma, así el resto de la app los trata igual
function normalizeQuestion(q) {
  if (!q || typeof q.pregunta !== "string" || q.pregunta.trim() === "") return null;
  const tipo = detectType(q);
  if (!tipo) return null;

  let opciones, correctas, letras;
  if (tipo === "vf") {
    // Verdadero o falso: las opciones son fijas; "correcta" es true/false (también se acepta el texto "verdadero" / "falso")
    let valor = q.correcta;
    if (typeof valor === "string") valor = { verdadero: true, v: true, falso: false, f: false }[valor.trim().toLowerCase()];
    if (typeof valor !== "boolean") return null;
    opciones = VF_OPCIONES.slice();
    correctas = [valor ? 0 : 1];
    letras = ["V", "F"];
  } else {
    // Normal y múltiple: de 2 a 26 opciones
    if (!Array.isArray(q.opciones) || q.opciones.length < 2 || q.opciones.length > 26) return null;
    opciones = q.opciones.map(String);
    letras = opciones.map((_, i) => String.fromCharCode(65 + i)); // A, B, C, D...
    const validIndex = (n) => Number.isInteger(n) && n >= 0 && n < opciones.length;
    if (tipo === "normal") {
      if (!validIndex(q.correcta)) return null;
      correctas = [q.correcta];
    } else {
      // Múltiple: "correctas" es una lista de posiciones, con al menos 1 y sin repetidas
      if (!Array.isArray(q.correctas) || q.correctas.length < 1 || !q.correctas.every(validIndex)) return null;
      correctas = [...new Set(q.correctas)];
    }
  }

  return {
    tipo,
    pregunta: q.pregunta,
    opciones,
    correctas,
    letras,
    // [v1.3.0] Tema opcional de la pregunta: se muestra en gris arriba de la pregunta mientras se resuelve
    tema: typeof q.tema === "string" ? q.tema.trim() : "",
    // Descripción opcional: se muestra solo en los resultados, bajo una respuesta incorrecta
    descripcion: typeof q.descripcion === "string" ? q.descripcion.trim() : ""
  };
}

// Filtra preguntas mal armadas y avisa por consola cuál falló
function sanitizeQuestions(raw, origen) {
  const valid = [];
  raw.forEach((q, i) => {
    const norm = normalizeQuestion(q); // [v1.4.0] valida según el tipo (normal, verdadero/falso o múltiple)
    if (norm) {
      valid.push(norm);
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
    // [v1.6.1] Icono del test (nombre de Material Symbols, definido en el JSON). Si falta o es inválido, usa "connected_tv"
    icono: typeof data.icono === "string" && /^[a-z0-9_]+$/.test(data.icono.trim()) ? data.icono.trim() : "connected_tv",
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
    iconBox.appendChild(icon(t.icono)); // [v1.6.1] icono definido en el JSON del test

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

  // [v1.4.0] Según el tipo: normal y verdadero/falso eligen UNA opción (radio); selección múltiple permite marcar varias (casillas)
  const multi = q.tipo === "multiple";
  const picked = answers[current] || []; // posiciones ya elegidas (al volver a una pregunta se conservan)
  els.qHint.textContent = multi ? "Seleccioná todas las correctas" : ""; // aviso fijo solo en múltiple (vacío = oculto por CSS)
  els.options.setAttribute("role", multi ? "group" : "radiogroup");

  els.options.textContent = "";
  q.opciones.forEach((texto, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    // [v1.5.1] En verdadero/falso cada opción lleva la clase de su valor ("option--vf-v" = Verdadero,
    // "option--vf-f" = Falso): el CSS ilumina la elegida en verde o rojo según ese valor
    const vfSide = q.tipo === "vf" ? (i === 0 ? " option--vf-v" : " option--vf-f") : "";
    btn.className = multi ? "option option--multi" : "option" + vfSide;
    btn.setAttribute("role", multi ? "checkbox" : "radio");
    btn.setAttribute("aria-checked", String(picked.includes(i)));
    btn.style.animationDelay = `${i * 70}ms`;
    if (picked.includes(i)) btn.classList.add("option--selected");

    const letter = document.createElement("span");
    letter.className = "option__letter";
    letter.textContent = q.letras[i]; // A, B, C, D... (en verdadero/falso: V y F)

    const label = document.createElement("span");
    label.className = "option__text";
    label.textContent = texto;

    btn.append(letter, label);

    // [v1.4.0] En múltiple se agrega una casilla a la derecha que se tilda al marcar la opción
    if (multi) {
      const mark = icon(picked.includes(i) ? "check_box" : "check_box_outline_blank");
      mark.classList.add("option__mark");
      btn.appendChild(mark);
    }

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

// Guarda la opción elegida y la resalta (se puede cambiar antes de avanzar).
// [v1.4.0] En normal y verdadero/falso reemplaza la elección; en selección múltiple marca o desmarca la opción tocada
// (si no queda ninguna marcada, la pregunta vuelve a estar sin responder)
function selectOption(i) {
  const q = questions[current];
  if (q.tipo === "multiple") {
    const sel = new Set(answers[current] || []);
    if (sel.has(i)) sel.delete(i); else sel.add(i);
    answers[current] = sel.size > 0 ? [...sel].sort((a, b) => a - b) : null;
  } else {
    answers[current] = [i];
  }

  const picked = answers[current] || [];
  [...els.options.children].forEach((btn, idx) => {
    const selected = picked.includes(idx);
    btn.classList.toggle("option--selected", selected);
    btn.setAttribute("aria-checked", String(selected));
    const mark = btn.querySelector(".option__mark"); // casilla de la selección múltiple
    if (mark) mark.textContent = selected ? "check_box" : "check_box_outline_blank";
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
// [v1.3.0] Solo hasta MAX_BACK (2) preguntas por detrás de la más lejana alcanzada; también rige para la flecha izquierda del teclado.
// [v1.5.2] Ya no pide confirmación: volver a la pregunta anterior no saca del test ni pierde respuestas
function goPrev() {
  if (current <= minAllowedIndex()) return;
  current--;
  renderQuestion();
}

// [v1.5.2] Flecha "Volver" (arriba a la izquierda): sale del test y regresa a la vista previa
// (pantalla de inicio del test). Como salir borra el progreso de la vuelta, pide confirmación antes
async function goBackToPreview() {
  if (!quizActive) return;
  const answered = answers.filter((a) => a !== null).length;
  const ok = await askConfirm({
    icon: "exit_to_app",
    title: "¿Volver a la vista previa?",
    text: answered === 0
      ? "Vas a salir del test. Todavía no contestaste ninguna pregunta."
      : `Vas a salir del test y se borran las ${answered} ${answered === 1 ? "respuesta que diste" : "respuestas que diste"}: para volver a hacerlo hay que empezar de nuevo.`,
    okLabel: "Salir del test",
    cancelLabel: "Quedarme"
  });
  if (!ok) return;
  quizActive = false;
  setTag("LISTO");
  showScreen(els.screenStart);
}

/* =========================================================
   7) RESULTADOS (float con puntaje /10 y revisión)
   ========================================================= */

// Calcula las notas y abre el float de resultados.
// [v1.3.0] El test se puede terminar en cualquier momento ("Terminar test"): las preguntas sin contestar suman 0
// en el promedio general y no cuentan en el promedio de contestadas
// [v1.5.0] Si quedan preguntas sin contestar, antes de terminar pide confirmación en una ventana flotante
async function finishTest() {
  if (!quizActive) return; // evita terminar dos veces (por ejemplo, con un doble toque)
  const unanswered = questions.length - answers.filter((a) => a !== null).length;
  if (unanswered > 0) {
    const ok = await askConfirm({
      icon: "warning",
      title: "¿Terminar el test antes de tiempo?",
      text: `Te quedan ${unanswered} ${unanswered === 1 ? "pregunta sin contestar" : "preguntas sin contestar"}. Si terminás ahora, contarán como incorrectas en el promedio general y el resultado quedará como "Incompleto".`,
      okLabel: "Terminar igual",
      cancelLabel: "Seguir con el test"
    });
    if (!ok) return;
  }
  quizActive = false;
  setTag("FINALIZADO");

  const total = questions.length;
  // [v1.4.0] Puntos totales: cada pregunta aporta de 0 a 1 (la selección múltiple puede aportar un valor parcial)
  const points = questions.reduce((acc, q, i) => acc + questionCredit(q, answers[i]), 0);
  const answered = answers.filter((a) => a !== null).length;   // preguntas contestadas
  const incomplete = answered < total;                         // true si quedó alguna sin contestar
  const scoreAll = calcScore(points, total);                   // promedio general: las sin contestar suman 0
  const scoreAnswered = answered > 0 ? calcScore(points, answered) : null; // solo contestadas (null si no contestó ninguna)

  buildReview();
  showFloat({ scoreAll, scoreAnswered, points, answered, total, incomplete });
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

// [v1.4.0] Línea de puntaje parcial ("Puntaje parcial: 0.33 / 1") para las selecciones múltiples respondidas a medias
function partialNote(credit) {
  const p = document.createElement("p");
  p.className = "review__partial";
  p.textContent = `Puntaje parcial: ${formatPoints(credit)} / 1`;
  return p;
}

// Arma la lista con todas las preguntas y las respuestas elegidas
// (verde = bien, rojo = mal, gris = sin responder, [v1.4.0] amarillo = parcial en selección múltiple)
function buildReview() {
  els.reviewList.textContent = "";

  questions.forEach((q, i) => {
    const chosen = answers[i];                          // [v1.4.0] lista de posiciones elegidas (o null)
    const credit = questionCredit(q, chosen);           // [v1.4.0] valor de la respuesta: de 0 a 1
    const full = credit === 1;                          // acierto completo
    const skipped = chosen === null;                    // pregunta sin responder
    const partial = !skipped && credit > 0 && credit < 1; // [v1.4.0] acierto parcial (solo selección múltiple)
    const tone = full ? "ok" : skipped ? "skip" : partial ? "partial" : "bad"; // tono: verde / gris / amarillo / rojo

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

    const status = icon(full ? "check_circle" : skipped ? "help" : partial ? "rule" : "cancel"); // [v1.4.0] "rule" = a medias
    status.classList.add("review__status");

    head.append(num, qText, status);
    item.appendChild(head);

    if (q.tipo === "multiple") {
      // [v1.4.0] Selección múltiple: una línea por cada opción marcada (verde si era correcta, roja si no)
      if (skipped) {
        item.appendChild(answerLine("Tu respuesta", "Sin responder", "skip"));
      } else {
        chosen.forEach((idx) => {
          item.appendChild(answerLine("Marcaste", q.opciones[idx], q.correctas.includes(idx) ? "ok" : "bad"));
        });
      }
      // ...y las correctas que no se marcaron, en verde ("Faltó"; si no respondió nada, "Correcta")
      if (!full) {
        q.correctas
          .filter((idx) => !(chosen || []).includes(idx))
          .forEach((idx) => item.appendChild(answerLine(skipped ? "Correcta" : "Faltó", q.opciones[idx], "ok")));
      }
      // Si quedó a medias, se aclara cuánto vale la pregunta
      if (partial) item.appendChild(partialNote(credit));
    } else {
      // Normal y verdadero/falso: respuesta elegida (verde si acertó, roja si falló, gris si quedó sin responder)
      const chosenText = skipped ? "Sin responder" : q.opciones[chosen[0]];
      item.appendChild(answerLine("Tu respuesta", chosenText, skipped ? "skip" : full ? "ok" : "bad"));

      // Si no acertó, también se muestra la correcta en verde
      if (!full) item.appendChild(answerLine("Correcta", q.opciones[q.correctas[0]], "ok"));
    }

    // [v1.2.0] Si la pregunta tiene descripción, la explicación va debajo (solo cuando no se acertó del todo)
    if (!full && q.descripcion) item.appendChild(descriptionBlock(q.descripcion));

    els.reviewList.appendChild(item);
  });
}

// Abre el float y anima el puntaje (conteo + aro)
// [v1.3.0] Recibe las dos notas: el aro, el conteo, el mensaje y el color usan la general (scoreAll).
// Si el test quedó incompleto se muestran además "Incompleto" (naranja) y los 2 promedios
function showFloat({ scoreAll, scoreAnswered, points, answered, total, incomplete }) {
  const score = scoreAll; // el resto de la función (aro y conteo) trabaja con la nota general
  els.scoreMsg.textContent = scoreMessage(score);
  els.scoreBox.dataset.tone = scoreTone(score); // el CSS pinta aro y mensaje según este tono
  els.scoreIncomplete.hidden = !incomplete;
  els.scoreAvgs.hidden = !incomplete;
  els.avgAll.textContent = formatScore(scoreAll);
  els.avgAnswered.textContent = scoreAnswered === null ? "—" : formatScore(scoreAnswered); // "—" si no contestó ninguna
  // [v1.4.0] "points" puede tener decimales por el puntaje parcial (ej.: "3.33 de 5 correctas")
  els.scoreMeta.textContent = incomplete
    ? `${formatPoints(points)} de ${total} correctas · ${answered} contestadas`
    : `${formatPoints(points)} de ${total} correctas`;
  els.scoreValue.textContent = "0";
  els.scoreBar.style.strokeDashoffset = RING_LENGTH; // aro vacío antes de animar

  // [v1.5.0] Barra compacta que aparece al scrollear: mismos datos, en versión mínima
  els.miniValue.textContent = formatScore(scoreAll);
  els.miniMsg.textContent = scoreMessage(score);
  els.miniIncomplete.hidden = !incomplete;
  els.scoreMini.dataset.tone = scoreTone(score); // el CSS colorea el mensaje según el tono

  // [v1.5.0] El float abre siempre en modo completo (la barra mini aparece solo al scrollear)
  els.floatPanel.classList.remove("float__panel--mini");
  els.floatBody.scrollTop = 0;

  els.float.hidden = false;
  document.body.classList.add("no-scroll");
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

/* =========================================================
   7b) VENTANA FLOTANTE DE CONFIRMACIÓN  [v1.5.0]
   ========================================================= */

// Abre la ventana de confirmación (icono, título y texto según el caso) y devuelve una promesa
// que se resuelve en true si el usuario confirma o en false si cancela
function askConfirm({ icon: iconName, title, text, okLabel = "Confirmar", cancelLabel = "Cancelar" }) {
  return new Promise((resolve) => {
    pendingConfirm = resolve;
    els.confirmIcon.textContent = iconName;
    els.confirmTitle.textContent = title;
    els.confirmText.textContent = text;
    els.confirmOk.textContent = okLabel;
    els.confirmCancel.textContent = cancelLabel;
    els.confirmBox.hidden = false;
    document.body.classList.add("no-scroll");
    els.confirmCancel.focus({ preventScroll: true }); // el foco arranca en "Cancelar": la opción segura
  });
}

// Cierra la ventana de confirmación y responde la promesa pendiente (true = confirmó, false = canceló)
function closeConfirm(result) {
  if (!pendingConfirm) return;
  els.confirmBox.hidden = true;
  document.body.classList.remove("no-scroll");
  const resolve = pendingConfirm;
  pendingConfirm = null;
  resolve(result);
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
els.btnBack.addEventListener("click", goBackToPreview); // [v1.5.2] flecha "Volver": sale del test (con confirmación)
els.btnPrev.addEventListener("click", goPrev);
els.btnNext.addEventListener("click", goNext);
els.btnFinish.addEventListener("click", finishTest); // [v1.3.0] "Terminar test": cierra el test cuando se quiera
els.btnRetry.addEventListener("click", retry);
els.btnHome.addEventListener("click", showMenu);   // [v1.2.0] "Menú" del float: vuelve a elegir test

// [v1.5.0] Ventana de confirmación: "Cancelar" (y un toque en el fondo) cierra sin hacer nada
els.confirmOk.addEventListener("click", () => closeConfirm(true));
els.confirmCancel.addEventListener("click", () => closeConfirm(false));
els.confirmBox.addEventListener("click", (e) => {
  if (e.target === els.confirmBox) closeConfirm(false);
});

// [v1.5.0] Al scrollear la lista de respuestas, el encabezado del puntaje se minimiza en una barra arriba de todo;
// al volver al tope, se expande de nuevo
els.floatBody.addEventListener("scroll", () => {
  els.floatPanel.classList.toggle("float__panel--mini", els.floatBody.scrollTop > 60);
});

// [v1.5.0] La página se comporta como un formulario: con un test en curso, el navegador advierte
// antes de cerrar la pestaña o recargar que el progreso puede perderse
window.addEventListener("beforeunload", (e) => {
  if (!quizActive) return;
  e.preventDefault();        // estándar
  e.returnValue = "";         // necesario para Chrome y Edge
});

// Atajos de teclado durante el test: A-Z o 1-9 eligen opción (en verdadero/falso también V y F), flechas navegan.
// [v1.4.0] En selección múltiple la misma tecla marca o desmarca la opción
// [v1.5.0] Si la ventana de confirmación está abierta, solo Escape la cierra (no se contesta el test de fondo)
document.addEventListener("keydown", (e) => {
  if (pendingConfirm) {
    if (e.key === "Escape") closeConfirm(false);
    return;
  }
  if (!quizActive || e.ctrlKey || e.metaKey || e.altKey) return;

  const key = e.key.toLowerCase();
  const q = questions[current];

  if (e.key === "ArrowLeft") { goPrev(); return; }
  if (e.key === "ArrowRight") { goNext(); return; }

  // [v1.4.0] La letra se busca entre las letras de la pregunta (A, B, C... o V y F); si no es letra, se prueba como número
  let idx = q.letras.findIndex((l) => l.toLowerCase() === key); // a=0, b=1... (v=0, f=1 en verdadero/falso)
  if (idx === -1 && /^[1-9]$/.test(key)) idx = Number(key) - 1;  // 1=0, 2=1...

  if (idx >= 0 && idx < q.opciones.length) selectOption(idx);
});

/* =========================================================
   9) INICIO DE LA APP
   ========================================================= */

renderTitle(els.menuTitle, "Test");
setTag("MENÚ");
loadCatalog(); // [v1.2.0] lee tests/index.json y arma el menú

// [v1.6.0] PWA: registra el service worker para poder instalar la app y que funcione sin conexión.
// Solo se registra si la página se sirve por HTTPS (o localhost); abriendo el archivo directo no hay
// service worker, pero la app sigue funcionando igual (solo que sin instalación y sin modo offline)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.warn("[Test] No se pudo registrar el service worker:", err);
    });
  });
}