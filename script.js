/* =========================================================
   TEST — script.js  (v1.9.0)
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
     "icono": "lan",                           // [v1.7.0] opcional: icono del test en el menú (nombre de fonts.google.com/icons; por defecto "connected_tv")
     "dificultades": {                         // [v1.9.0] opcional: el mismo test dividido por dificultad. Cada una es opcional
       "facil":   [ { ...pregunta... } ],       // y solo aparecen en el switch las que existan. Si queda una sola (o solo "preguntas"),
       "normal":  [ { ...pregunta... } ],       // no hay switch. El "preguntas" de arriba equivale a la dificultad "normal".
       "dificil": [ { ...pregunta... } ]        // Con "dificultades" no hace falta poner "preguntas".
     },
     "contrasena": "clave123",                 // [v1.8.0] opcional: contraseña para hacer el test (4 a 15 caracteres). Al elegir el test se
                                               // piden con un cuadrito por carácter. Si el largo no es válido, el test no se carga.
                                               // Ojo: el JSON es público (se descarga con la página), así que frena a curiosos pero no es seguridad real
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

   [v1.7.0] NOVEDADES
   • "dificil": true en cualquier pregunta (de cualquier tipo) la marca como PREGUNTA DIFÍCIL: aparece la etiqueta con
     calavera (icono "skull") y todos los celestes de la pantalla pasan a rojo mientras se resuelve. También se marca en los resultados.
       { "pregunta": "...", "opciones": ["A", "B", "C"], "correcta": 1, "dificil": true }
   • NUEVO TIPO "palabras" (formación de palabras, estilo Duolingo). "pregunta" es la oración incompleta o el problema;
     "correcta" es la LISTA DE PALABRAS en el orden correcto y "extras" (opcional) son palabras de más para confundir.
     El banco se mezcla solo en cada intento. Cada elemento puede ser una palabra o una frase corta. Vale 1 si la
     respuesta armada es exactamente la correcta y en orden; si no, 0 (no hay puntaje parcial).
       { "tipo": "palabras", "pregunta": "Completá: el modelo OSI tiene...", "correcta": ["siete", "capas"], "extras": ["cinco", "niveles"] }
     (si "correcta" es una lista de textos, el tipo "palabras" también se detecta solo)
   • Verdadero o falso ahora muestra los iconos "check" y "close" en lugar de las letras V y F (se sigue pudiendo
     contestar con las teclas V y F).
   • MODO DE CORRECCIÓN: en la vista previa del test hay un switch para elegir entre "Corrección final" (el de siempre) y
     "Corrección instantánea": sin botón "Anterior"; al responder se muestra enseguida si estuvo bien (en verde/rojo),
     la respuesta correcta y la explicación, y recién con "Continuar" se pasa a la siguiente. En normal y verdadero/falso
     tocar una opción ya es responder; en selección múltiple y en palabras se responde con "Comprobar". Al terminar
     todas se muestran los resultados finales igual que siempre. Una pregunta marcada pero sin comprobar no cuenta.
   • HISTORIAL: al terminar un test (también si se terminó antes) el resultado completo se guarda en este dispositivo
     (localStorage). Se conservan los últimos 10; se ven desde el botón "Historial" del menú y al tocar uno se abre el
     mismo panel de resultados. Para vaciarlo está el botón "Borrar historial".
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
const HISTORY_KEY = "test.historial.v1";  // [v1.7.0] clave de localStorage donde se guardan los últimos resultados (solo en este dispositivo)
// [v1.9.0] Dificultades de un test, de menor a mayor: nombre que se ve y orden. "normal" es la predeterminada
const NIVELES = {
  facil: { label: "Fácil", icon: "mood " },
  normal: { label: "Normal", icon: "sentiment_satisfied" },
  dificil: { label: "Difícil", icon: "skull" }
};
const NIVEL_ORDEN = ["facil", "normal", "dificil"];
const PASS_MIN = 4;  // [v1.8.0] largo mínimo de la contraseña de un test
const PASS_MAX = 15; // [v1.8.0] largo máximo
const unlockedTests = new Set(); // [v1.8.0] tests ya desbloqueados en esta sesión (se pierde al recargar la página)
const HISTORY_MAX = 10;                   // [v1.7.0] cuántos resultados se conservan en el historial (los más viejos se descartan)
const MODOS = {                           // [v1.7.0] modos de corrección: nombre y descripción que se muestra en el switch
  final: {
    label: "Corrección final",
    desc: "Ves los resultados cuando terminás el test y podés volver a preguntas anteriores."
  },
  instant: {
    label: "Corrección instantánea",
    desc: "Respondés, apretás \"Comprobar\" y ves si acertaste, con la explicación; recién ahí pasás a la siguiente. No se puede volver atrás."
  }
};

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
  levels: $("levels"),                   // [v1.9.0] bloque del switch de dificultad (arriba del título)
  levelSwitch: $("levelSwitch"),
  levelBtns: [...document.querySelectorAll("#levelSwitch .mode")],
  lockBox: $("lockBox"),                 // [v1.8.0] aviso de "test protegido" en la vista previa
  lockIcon: $("lockIcon"),
  lockInfo: $("lockInfo"),               // [v1.8.1]
  passBox: $("passBox"),                 // [v1.8.1] ventana flotante de contraseña
  passText: $("passText"),
  pinBoxes: $("pinBoxes"),
  lockMsg: $("lockMsg"),
  passToggle: $("passToggle"),           // [v1.8.1] botón de ojo: muestra/oculta la contraseña
  passToggleIcon: $("passToggleIcon"),
  passCancel: $("passCancel"),
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
  miniIncomplete: $("miniIncomplete"),
  // [v1.7.0] etiqueta "Pregunta difícil", armado de palabras, cartel de corrección y barra de navegación
  qBadge: $("qBadge"),
  wordBuild: $("wordBuild"),
  wordAnswer: $("wordAnswer"),
  wordBank: $("wordBank"),
  feedback: $("feedback"),
  quizNav: $("quizNav"),
  // [v1.7.0] switch de modo de corrección (vista previa del test)
  modeSwitch: $("modeSwitch"),
  modeBtns: [...document.querySelectorAll("#modeSwitch .mode")],
  modeDesc: $("modeDesc"),
  // [v1.7.0] historial (botón del menú, pantalla de historial y datos extra del panel de resultados)
  btnHistory: $("btnHistory"),
  btnHistoryLabel: $("btnHistoryLabel"),
  screenHistory: $("screenHistory"),
  btnHistoryBack: $("btnHistoryBack"),
  btnHistoryClear: $("btnHistoryClear"),
  histNotice: $("histNotice"),
  histList: $("histList"),
  scoreSource: $("scoreSource"),
  btnHomeIcon: $("btnHomeIcon"),
  btnHomeLabel: $("btnHomeLabel")
};

let catalog = [];       // [v1.2.0] tests cargados desde los JSON: { file, nombre, tema, preguntas }
let currentTest = null; // [v1.2.0] test elegido en el menú
let questions = [];     // Preguntas del test elegido (ya validadas)
let current = 0;        // Índice de la pregunta actual
let answers = [];       // [v1.4.0] Respuesta por pregunta: lista de posiciones elegidas (1 en normal y V/F, varias en múltiple); null = sin responder
let quizActive = false; // true mientras se está resolviendo el test
let maxReached = 0;     // [v1.3.0] índice de la pregunta más lejana a la que se llegó (límite para "Anterior")
let level = "normal"; // [v1.9.0] dificultad elegida del test actual (facil | normal | dificil)
let pendingConfirm = null; // [v1.5.0] función que espera la respuesta de la ventana de confirmación (null = cerrada)
let mode = "final";        // [v1.7.0] modo de corrección elegido: "final" (resultados al terminar) o "instant" (corrige cada pregunta)
let checked = [];          // [v1.7.0] modo instantáneo: true en las preguntas ya corregidas (quedan bloqueadas)
let bankOrders = [];       // [v1.7.0] palabras: orden mezclado del banco de cada pregunta de formación de palabras (null en las demás)
let floatFromHistory = false; // [v1.7.0] true si el panel de resultados se abrió desde el historial (y no al terminar un test)

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
  // [v1.7.0] Formación de palabras: vale 1 solo si las palabras puestas son EXACTAMENTE la solución y en el mismo orden
  if (q.tipo === "palabras") return sameSequence(ans.map((i) => q.opciones[i]), q.solucion) ? 1 : 0;
  const hits = ans.filter((i) => q.correctas.includes(i)).length; // correctas marcadas
  const wrong = ans.length - hits;                                // incorrectas marcadas
  return Math.max(0, (hits - wrong) / q.correctas.length);
}

// [v1.4.0] Formatea puntos, que pueden ser fraccionarios: 3 -> "3", 2.6667 -> "2.67"
const formatPoints = (v) => String(Math.round(v * 100) / 100);

// [v1.7.0] true si dos listas tienen los mismos elementos en el mismo orden
const sameSequence = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

// [v1.7.0] Mezcla el banco de palabras de una pregunta de formación de palabras (Fisher-Yates) y devuelve la lista de
// posiciones del banco en orden aleatorio. Si por casualidad queda igual que el orden de la solución, se vuelve a mezclar
function shuffleBank(q) {
  const ids = q.opciones.map((_, i) => i);
  for (let intento = 0; intento < 6; intento++) {
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    if (ids.length < 2 || ids.some((id, i) => id !== i)) break;
  }
  return ids;
}

// [v1.7.0] Pregunta difícil: pone o saca la clase del body que cambia todos los celestes por rojo
// (style.css redefine las variables de acento en body.is-hard)
function setHardTheme(on) {
  document.body.classList.toggle("is-hard", !!on);
}

// [v1.7.0] Fecha y hora legibles para el historial: "22/10/2026, 21:30"
function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

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
  // [v1.7.0] Ahora son 4 pantallas (menú, historial, inicio del test, test); el tema rojo de "pregunta difícil" solo rige en la del test
  [els.screenMenu, els.screenHistory, els.screenStart, els.screenQuiz].forEach((s) => s.classList.remove("screen--active"));
  screen.classList.add("screen--active");
  if (screen !== els.screenQuiz) setHardTheme(false);
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
    if (t.startsWith("palabra") || t.startsWith("formacion")) return "palabras"; // [v1.7.0] formación de palabras
    if (t === "normal") return "normal";
    return null;
  }
  if (Array.isArray(q.correctas)) return "multiple";
  if (Array.isArray(q.correcta)) return "palabras"; // [v1.7.0] "correcta" es una lista de palabras
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
  let solucion = []; // [v1.7.0] solo en "palabras": la respuesta correcta como lista de palabras en orden
  if (tipo === "palabras") {
    // [v1.7.0] Formación de palabras: "correcta" = palabras en el orden correcto (1 a 30); "extras" (opcional) = palabras de más.
    // El banco queda como [...solución, ...extras]; el orden en que se muestra se mezcla en cada intento (ver shuffleBank)
    const extras = q.extras === undefined ? [] : q.extras;
    if (!Array.isArray(q.correcta) || q.correcta.length < 1 || q.correcta.length > 30) return null;
    if (!Array.isArray(extras) || extras.length > 20) return null;
    const limpiar = (lista) => lista.map((w) => (typeof w === "string" || typeof w === "number" ? String(w).trim() : ""));
    solucion = limpiar(q.correcta);
    const sobrantes = limpiar(extras);
    if (solucion.concat(sobrantes).some((w) => w === "")) return null; // no se aceptan palabras vacías ni que no sean texto
    opciones = solucion.concat(sobrantes);
    correctas = solucion.map((_, i) => i); // posiciones de la solución dentro del banco, en orden
    letras = [];                            // el armado de palabras no usa letras ni atajos de teclado
  } else if (tipo === "vf") {
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
    solucion,
    // [v1.7.0] Pregunta difícil (cualquier tipo): "dificil": true en el JSON (también se acepta "si" / "sí" / "true" como texto)
    dificil: q.dificil === true || (typeof q.dificil === "string" && ["true", "si", "sí", "1"].includes(q.dificil.trim().toLowerCase())),
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
  // [v1.9.0] Dificultades: "dificultades": { "facil": [...], "normal": [...], "dificil": [...] }. Cada una es opcional.
  // El "preguntas" de siempre (sin dificultades) cuenta como la dificultad "normal", así los tests viejos siguen andando
  const niveles = {};
  if (data && data.dificultades !== undefined) {
    if (!data.dificultades || typeof data.dificultades !== "object" || Array.isArray(data.dificultades)) {
      throw new Error("\"dificultades\" debe ser un objeto con facil, normal y/o dificil");
    }
    Object.entries(data.dificultades).forEach(([clave, lista]) => {
      // se acepta con o sin tilde y en cualquier mayúscula ("Fácil", "dificil"...)
      const key = clave.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      if (!NIVELES[key]) { console.warn(`[Test] ${file}: la dificultad "${clave}" no existe (usá facil, normal o dificil) y se omitió.`); return; }
      if (!Array.isArray(lista)) { console.warn(`[Test] ${file}: la dificultad "${clave}" debe ser una lista de preguntas.`); return; }
      niveles[key] = sanitizeQuestions(lista, `${file} (${NIVELES[key].label})`);
    });
  }
  if (Array.isArray(data && data.preguntas)) {
    if (niveles.normal && niveles.normal.length) console.warn(`[Test] ${file}: tiene "preguntas" y "dificultades.normal"; se usa "dificultades.normal".`);
    else niveles.normal = sanitizeQuestions(data.preguntas, file);
  }
  // Las dificultades sin preguntas válidas no aparecen
  NIVEL_ORDEN.forEach((k) => { if (niveles[k] && niveles[k].length === 0) delete niveles[k]; });
  const lista = NIVEL_ORDEN.filter((k) => niveles[k]);
  if (lista.length === 0) throw new Error("no tiene preguntas válidas (falta \"preguntas\" o \"dificultades\")");
  const nivelBase = niveles.normal ? "normal" : lista[0]; // predeterminada: normal; si no hay, la primera que exista
  return {
    file,
    nombre: typeof data.nombre === "string" && data.nombre.trim() ? data.nombre.trim() : file.replace(/\.json$/i, ""),
    tema: typeof data.tema === "string" ? data.tema.trim() : "",
    // [v1.7.0] Icono del test (nombre de Material Symbols, definido en el JSON). Si falta o es inválido, usa "connected_tv"
    icono: typeof data.icono === "string" && /^[a-z0-9_]+$/.test(data.icono.trim()) ? data.icono.trim() : "connected_tv",
    // [v1.8.0] Contraseña opcional: entre 4 y 15 caracteres. Si está mal definida el test NO se carga (así nunca queda
    // abierto por error un test que debía estar protegido)
    contrasena: parsePassword(data.contrasena),
    niveles,                    // [v1.9.0] preguntas de cada dificultad existente
    nivelesLista: lista,        // [v1.9.0] dificultades disponibles, de fácil a difícil
    nivelBase,                  // [v1.9.0] dificultad con la que arranca la vista previa
    preguntas: niveles[nivelBase] // preguntas de la dificultad base (el menú cuenta con estas)
  };
}

// [v1.8.0] Valida el campo "contrasena" del JSON: devuelve "" si no hay, o el texto (4 a 15 caracteres); si no sirve, lanza error
function parsePassword(v) {
  if (v === undefined || v === null || v === "") return "";
  if (typeof v !== "string" || [...v].length < PASS_MIN || [...v].length > PASS_MAX) {
    throw new Error(`"contrasena" debe ser un texto de ${PASS_MIN} a ${PASS_MAX} caracteres`);
  }
  return v;
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
    iconBox.appendChild(icon(t.icono)); // [v1.7.0] icono definido en el JSON del test

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
    // [v1.9.0] si el test tiene varias dificultades, el menú lo avisa (el conteo es el de la dificultad base)
    if (t.nivelesLista.length > 1) meta.textContent += ` · ${t.nivelesLista.length} dificultades`;
    if (t.contrasena) {
      const lock = icon(unlockedTests.has(t.file) ? "lock_open" : "lock"); // [v1.8.0] candado: el test tiene contraseña
      lock.classList.add("test-card__lock");
      meta.appendChild(lock);
    }
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
  updateHistoryButton(); // [v1.7.0] actualiza la cantidad de resultados guardados en el botón "Historial"
  showScreen(els.screenMenu);
}

// Elige un test del menú y muestra su pantalla de inicio
function selectTest(t) {
  currentTest = t;
  setLevel(t.nivelBase); // [v1.9.0] cada test arranca en su dificultad base (normal por defecto)
  setMode("final"); // [v1.7.0] cada test arranca en el modo de siempre (corrección final)
  setupStart();
  showScreen(els.screenStart);
}

// [v1.9.0] Cambia la dificultad (switch de la vista previa): carga las preguntas de ese nivel y actualiza el conteo.
// El switch solo se ve si el test tiene 2 o 3 dificultades, y solo muestra las que existen
function setLevel(l) {
  const lista = currentTest.nivelesLista;
  level = lista.includes(l) ? l : currentTest.nivelBase;
  questions = currentTest.niveles[level];
  els.levels.hidden = lista.length < 2;
  els.levelBtns.forEach((b) => { // oculta las dificultades que el test no tiene y marca la elegida
    b.hidden = !lista.includes(b.dataset.level);
    b.setAttribute("aria-checked", String(b.dataset.level === level));
  });
  els.levelSwitch.dataset.level = level; // [v1.9.1] el CSS colorea el switch según la dificultad (verde / celeste / rojo)
  els.levelSwitch.style.setProperty("--n", lista.length);          // cantidad de opciones visibles
  els.levelSwitch.style.setProperty("--i", lista.indexOf(level));  // posición de la pastilla
  els.statCount.textContent = questions.length;
}

// [v1.9.0] Nombre de una dificultad para mostrar ("" si no hay o no existe: así el .filter(Boolean) la salta)
function levelLabel(k) {
  return NIVELES[k] ? NIVELES[k].label : "";
}

// [v1.7.0] Cambia el modo de corrección (switch de la vista previa) y actualiza el switch y su descripción
function setMode(m) {
  mode = m === "instant" ? "instant" : "final";
  els.modeSwitch.dataset.mode = mode; // el CSS desliza la pastilla hacia la opción elegida
  els.modeBtns.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.mode === mode)));
  els.modeDesc.textContent = MODOS[mode].desc;
}

/* =========================================================
   5) PANTALLA DE INICIO DEL TEST
   ========================================================= */

// Prepara la pantalla de inicio con los datos del test elegido
function setupStart() {
  renderTitle(els.mainTitle, currentTest.nombre);
  els.testTopic.textContent = currentTest.tema;
  document.title = `${currentTest.nombre} · Test`;
  setTag("LISTO");
  setupLock(); // [v1.8.0] muestra los cuadritos de contraseña si el test está protegido
}

// [v1.8.1] Prepara el aviso de la vista previa: si el test tiene contraseña, muestra el candado (cerrado o abierto).
// La contraseña se pide en una ventana flotante al apretar "Comenzar" (openPasswordModal)
function setupLock() {
  const unlocked = unlockedTests.has(currentTest.file);
  els.lockBox.hidden = !currentTest.contrasena;
  els.lockIcon.textContent = unlocked ? "lock_open" : "lock";
  els.lockInfo.textContent = unlocked ? "Test desbloqueado." : "Este test pide una contraseña al comenzar.";
}

// [v1.8.1] Botón "Comenzar": si el test está protegido y todavía no se desbloqueó, abre la ventana de contraseña;
// si no, empieza el test
function onStartClick() {
  if (currentTest.contrasena && !unlockedTests.has(currentTest.file)) openPasswordModal();
  else startTest();
}

// [v1.8.1] Abre la ventana flotante de contraseña: un cuadrito por carácter (como el código de ÉLIX), con un botón de
// ojo para mostrar u ocultar lo escrito
function openPasswordModal() {
  const chars = [...currentTest.contrasena];
  els.pinBoxes.textContent = "";
  els.pinBoxes.className = "pin";
  chars.forEach((_, i) => {
    const b = document.createElement("input");
    b.type = "password"; // por defecto los caracteres quedan ocultos
    b.className = "pin__box";
    b.placeholder = " "; // permite el estilo :placeholder-shown para saber si el cuadrito tiene algo
    b.maxLength = 1;
    b.autocomplete = "off";
    b.autocapitalize = "off";
    b.spellcheck = false;
    b.setAttribute("aria-label", `Carácter ${i + 1} de ${chars.length}`);
    b.addEventListener("input", () => onPinInput(i));
    b.addEventListener("keydown", (e) => onPinKey(e, i));
    b.addEventListener("focus", () => b.select());
    b.addEventListener("paste", (e) => onPinPaste(e, i));
    els.pinBoxes.appendChild(b);
  });
  setPinVisible(false);
  els.passText.textContent = `Ingresá la contraseña de ${chars.length} caracteres para hacer este test.`;
  els.lockMsg.className = "lock__msg";
  els.lockMsg.textContent = "";
  els.passBox.hidden = false;
  document.body.classList.add("no-scroll");
  els.pinBoxes.firstElementChild.focus({ preventScroll: true });
}

// [v1.8.1] Cierra la ventana de contraseña sin desbloquear nada
function closePasswordModal() {
  els.passBox.hidden = true;
  document.body.classList.remove("no-scroll");
}

// [v1.8.1] Muestra (true) u oculta (false) los caracteres de los cuadritos y actualiza el botón de ojo
function setPinVisible(visible) {
  [...els.pinBoxes.children].forEach((b) => { b.type = visible ? "text" : "password"; });
  els.passToggle.setAttribute("aria-pressed", String(visible));
  els.passToggle.setAttribute("aria-label", visible ? "Ocultar contraseña" : "Mostrar contraseña");
  els.passToggleIcon.textContent = visible ? "visibility_off" : "visibility";
}

// Cambia el aspecto de los cuadritos (ok / error) y su mensaje
function setLockState(state, msg) {
  els.pinBoxes.classList.toggle("pin--ok", state === "ok");
  els.pinBoxes.classList.toggle("pin--error", state === "error");
  els.lockMsg.className = `lock__msg lock__msg--${state}`;
  els.lockMsg.textContent = msg;
}

// Escribió en un cuadrito: pasa al siguiente y, cuando están todos completos, verifica
function onPinInput(i) {
  const boxes = [...els.pinBoxes.children];
  els.pinBoxes.classList.remove("pin--error");
  if (boxes[i].value && i < boxes.length - 1) boxes[i + 1].focus();
  if (boxes.every((b) => b.value)) checkPassword();
}

// Teclas especiales: Borrar vuelve al cuadrito anterior, flechas se mueven, Enter verifica
function onPinKey(e, i) {
  const boxes = [...els.pinBoxes.children];
  if (e.key === "Backspace" && !boxes[i].value && i > 0) {
    boxes[i - 1].value = "";
    boxes[i - 1].focus();
    e.preventDefault();
  } else if (e.key === "ArrowLeft" && i > 0) {
    boxes[i - 1].focus();
    e.preventDefault();
  } else if (e.key === "ArrowRight" && i < boxes.length - 1) {
    boxes[i + 1].focus();
    e.preventDefault();
  } else if (e.key === "Enter" && boxes.every((b) => b.value)) {
    checkPassword();
  }
}

// Pegar texto: reparte los caracteres entre los cuadritos desde el actual
function onPinPaste(e, i) {
  e.preventDefault();
  const boxes = [...els.pinBoxes.children];
  const text = [...(e.clipboardData.getData("text") || "")];
  text.slice(0, boxes.length - i).forEach((c, k) => { boxes[i + k].value = c; });
  els.pinBoxes.classList.remove("pin--error");
  boxes[Math.min(i + text.length, boxes.length - 1)].focus();
  if (boxes.every((b) => b.value)) checkPassword();
}

// Compara lo escrito con la contraseña: si acierta desbloquea el test, cierra la ventana y lo comienza;
// si no, sacude y vacía los cuadritos para reintentar
function checkPassword() {
  const boxes = [...els.pinBoxes.children];
  const typed = boxes.map((b) => b.value).join("");
  if (typed === currentTest.contrasena) {
    unlockedTests.add(currentTest.file);
    boxes.forEach((b) => { b.disabled = true; });
    setLockState("ok", "Contraseña correcta.");
    setTimeout(() => { // pausa breve para que se vea el verde
      closePasswordModal();
      setupLock();
      startTest();
    }, 450);
  } else {
    setLockState("error", "Contraseña incorrecta. Probá de nuevo.");
    setTimeout(() => {
      boxes.forEach((b) => { b.value = ""; });
      els.pinBoxes.classList.remove("pin--error");
      boxes[0].focus();
    }, 450);
  }
}

/* =========================================================
   6) TEST (preguntas y navegación)
   ========================================================= */

// Comienza (o reinicia) el test desde la primera pregunta
function startTest() {
  if (questions.length === 0) return;
  if (currentTest.contrasena && !unlockedTests.has(currentTest.file)) return; // [v1.8.0] test protegido sin desbloquear
  current = 0;
  maxReached = 0; // [v1.3.0] reinicia el límite de "Anterior"
  answers = new Array(questions.length).fill(null);
  checked = new Array(questions.length).fill(false); // [v1.7.0] ninguna pregunta corregida todavía (modo instantáneo)
  // [v1.7.0] Formación de palabras: el banco de cada pregunta se mezcla de nuevo en cada intento
  bankOrders = questions.map((q) => (q.tipo === "palabras" ? shuffleBank(q) : null));
  // [v1.7.0] Modo instantáneo: no hay botón "Anterior" y el botón principal ocupa todo el ancho
  els.btnPrev.hidden = mode === "instant";
  els.quizNav.classList.toggle("quiz__nav--single", mode === "instant");
  quizActive = true;
  setTag("EN CURSO");
  showScreen(els.screenQuiz);
  renderQuestion();
}

// Dibuja la pregunta actual con sus opciones
// [v1.7.0] Ahora también: etiqueta "Pregunta difícil" (todo en rojo), iconos check/close en verdadero/falso,
// armado de palabras (tipo "palabras") y limpieza del cartel de corrección del modo instantáneo
function renderQuestion() {
  const q = questions[current];

  els.qCounter.textContent = `${pad(current + 1)} / ${pad(questions.length)}`;
  els.progressBar.style.width = `${((current + 1) / questions.length) * 100}%`;
  els.qText.textContent = q.pregunta; // textContent evita que el texto se interprete como HTML
  els.qTopic.textContent = q.tema;    // [v1.3.0] tema opcional: si está vacío, el CSS oculta el párrafo
  maxReached = Math.max(maxReached, current); // [v1.3.0] recuerda la pregunta más lejana alcanzada (límite de "Anterior")

  // [v1.7.0] Pregunta difícil: aparece la etiqueta con calavera y los celestes pasan a rojo mientras dure la pregunta
  els.qBadge.hidden = !q.dificil;
  setHardTheme(q.dificil);

  // [v1.7.0] Pregunta nueva: se oculta el cartel de corrección y se desbloquean las opciones
  els.feedback.hidden = true;
  els.feedback.textContent = "";
  els.options.classList.remove("options--locked");

  // [v1.4.0] Según el tipo: normal y verdadero/falso eligen UNA opción (radio); selección múltiple permite marcar varias (casillas)
  const multi = q.tipo === "multiple";
  const words = q.tipo === "palabras"; // [v1.7.0] formación de palabras: se arma con fichas, no con opciones
  const picked = answers[current] || []; // posiciones ya elegidas (al volver a una pregunta se conservan)
  els.qHint.textContent = multi
    ? "Seleccioná todas las correctas" // aviso fijo solo en múltiple (vacío = oculto por CSS)
    : words
      ? "Armá la respuesta tocando las palabras. Tocá una palabra ya puesta para sacarla."
      : "";
  els.options.setAttribute("role", multi ? "group" : "radiogroup");
  els.options.hidden = words;
  els.wordBuild.hidden = !words;

  els.options.textContent = "";
  if (words) {
    els.wordAnswer.classList.remove("wordbuild__answer--right", "wordbuild__answer--wrong");
    renderWords();
  } else {
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
      if (q.tipo === "vf") {
        letter.appendChild(icon(i === 0 ? "check" : "close")); // [v1.7.0] iconos check / close en lugar de "V" y "F"
      } else {
        letter.textContent = q.letras[i]; // A, B, C, D...
      }

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
  }

  // Reinicia la animación de entrada de la tarjeta en cada pregunta
  els.qCard.classList.remove("qcard--in");
  void els.qCard.offsetWidth;
  els.qCard.classList.add("qcard--in");

  window.scrollTo(0, 0); // [v1.2.0] en celular, cada pregunta nueva arranca desde arriba

  els.btnPrev.disabled = current <= minAllowedIndex(); // [v1.3.0] solo se puede volver hasta 2 preguntas
  updateNext();
}

// [v1.7.0] Crea una ficha de palabra (botón). "used" = es el hueco que queda en el banco cuando la palabra ya está
// en la respuesta; "locked" = la pregunta ya fue corregida (modo instantáneo) y no se puede tocar
function wordChip(texto, { used = false, locked = false, onClick = null } = {}) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "wordchip" + (used ? " wordchip--used" : "");
  b.textContent = texto;
  if (used || locked) b.disabled = true;
  if (used) {
    b.tabIndex = -1;
    b.setAttribute("aria-hidden", "true");
  }
  if (onClick && !used && !locked) b.addEventListener("click", onClick);
  return b;
}

// [v1.7.0] Dibuja la respuesta armada (arriba) y el banco de palabras (abajo) de la pregunta de formación de palabras actual.
// answers[current] guarda las posiciones del banco ya puestas, en orden; popLast anima la última palabra puesta
function renderWords(popLast = false) {
  const q = questions[current];
  const placed = answers[current] || [];
  const locked = mode === "instant" && checked[current];

  els.wordAnswer.textContent = "";
  placed.forEach((id, pos) => {
    const chip = wordChip(q.opciones[id], { locked, onClick: () => removeWord(pos) });
    if (popLast && pos === placed.length - 1) chip.classList.add("wordchip--pop");
    els.wordAnswer.appendChild(chip);
  });

  els.wordBank.textContent = "";
  bankOrders[current].forEach((id) => {
    els.wordBank.appendChild(wordChip(q.opciones[id], { used: placed.includes(id), locked, onClick: () => addWord(id) }));
  });
}

// [v1.7.0] Pasa una palabra del banco a la respuesta
function addWord(id) {
  if (!quizActive || (mode === "instant" && checked[current])) return;
  const placed = answers[current] || [];
  if (placed.includes(id)) return;
  answers[current] = [...placed, id];
  renderWords(true);
  updateNext();
}

// [v1.7.0] Saca una palabra de la respuesta (vuelve al banco); si no queda ninguna, la pregunta vuelve a estar sin responder
function removeWord(pos) {
  if (!quizActive || (mode === "instant" && checked[current])) return;
  const placed = [...(answers[current] || [])];
  placed.splice(pos, 1);
  answers[current] = placed.length > 0 ? placed : null;
  renderWords();
  updateNext();
}

// Guarda la opción elegida y la resalta (se puede cambiar antes de avanzar).
// [v1.4.0] En normal y verdadero/falso reemplaza la elección; en selección múltiple marca o desmarca la opción tocada
// (si no queda ninguna marcada, la pregunta vuelve a estar sin responder)
function selectOption(i) {
  const q = questions[current];
  if (q.tipo === "palabras") return;                    // [v1.7.0] las palabras se arman con las fichas
  if (mode === "instant" && checked[current]) return;   // [v1.7.0] pregunta ya corregida: no se puede cambiar
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
  // [v1.8.1] Corrección instantánea: tocar una opción YA NO corrige; solo la marca. La corrección ocurre al apretar
  // "Comprobar", así un toque equivocado se puede cambiar antes de corregir
}

// [v1.7.0] CORRECCIÓN INSTANTÁNEA: corrige la pregunta actual apenas se responde. Bloquea la pregunta, pinta las opciones
// (verde = correcta, rojo = elegida y mal, verde con línea cortada = era correcta y faltó) y muestra el cartel con el resultado
function checkAnswer() {
  if (mode !== "instant" || checked[current] || answers[current] === null) return;
  const q = questions[current];
  const chosen = answers[current];
  const credit = questionCredit(q, chosen);
  checked[current] = true;

  if (q.tipo === "palabras") {
    renderWords(); // se vuelve a dibujar con las fichas bloqueadas
    els.wordAnswer.classList.add(credit === 1 ? "wordbuild__answer--right" : "wordbuild__answer--wrong");
  } else {
    els.options.classList.add("options--locked");
    [...els.options.children].forEach((btn, idx) => {
      const isCorrect = q.correctas.includes(idx);
      if (chosen.includes(idx)) btn.classList.add(isCorrect ? "option--right" : "option--wrong");
      else if (isCorrect) btn.classList.add("option--missed");
      btn.setAttribute("aria-disabled", "true");
    });
  }

  showFeedback(q, chosen, credit);
  updateNext();
  els.btnNext.scrollIntoView({ block: "nearest", behavior: "smooth" }); // en celular, deja a la vista el cartel y "Continuar"
}

// [v1.7.0] Arma el cartel de corrección: ¡Correcto! / Parcialmente correcto / Incorrecto, y si no se acertó del todo,
// la respuesta correcta (o lo que faltó) y la explicación de la pregunta si la tiene
function showFeedback(q, chosen, credit) {
  const tone = credit === 1 ? "ok" : credit > 0 ? "partial" : "bad";
  const box = els.feedback;
  box.className = `feedback feedback--${tone}`;
  box.textContent = "";

  const head = document.createElement("div");
  head.className = "feedback__head";
  const title = document.createElement("span");
  title.textContent = tone === "ok" ? "¡Correcto!" : tone === "partial" ? "Parcialmente correcto" : "Incorrecto";
  head.append(icon(tone === "ok" ? "check_circle" : tone === "partial" ? "rule" : "cancel"), title);
  box.appendChild(head);
  box.hidden = false;
  if (credit === 1) return;

  if (q.tipo === "palabras") {
    box.appendChild(answerLine("Correcta", q.solucion.join(" "), "ok"));
  } else if (q.tipo === "multiple") {
    q.correctas.filter((idx) => !chosen.includes(idx))
      .forEach((idx) => box.appendChild(answerLine("Faltó", q.opciones[idx], "ok")));
  } else {
    box.appendChild(answerLine("Correcta", q.opciones[q.correctas[0]], "ok"));
  }
  if (tone === "partial") box.appendChild(partialNote(credit));
  if (q.descripcion) box.appendChild(descriptionBlock(q.descripcion));
}

// Habilita "Siguiente" solo si hay respuesta; en la última pregunta cambia a "Finalizar"
// [v1.7.0] En el modo instantáneo el botón cambia de función: "Comprobar" (selección múltiple y palabras, antes de corregir),
// y después de corregir "Continuar" / "Finalizar". En normal y verdadero/falso se corrige al tocar la opción
function updateNext() {
  const isLast = current === questions.length - 1;
  const hasAnswer = answers[current] !== null;

  if (mode === "instant") {
    // [v1.8.1] Todas las preguntas (normal, verdadero/falso, múltiple y palabras) se corrigen con "Comprobar"
    const needsCheck = !checked[current];
    els.btnNext.disabled = needsCheck ? !hasAnswer : !checked[current];
    els.btnNextLabel.textContent = needsCheck ? "Comprobar" : isLast ? "Finalizar" : "Continuar";
    els.btnNextIcon.textContent = needsCheck ? "check" : isLast ? "flag" : "arrow_forward";
    return;
  }

  els.btnNext.disabled = !hasAnswer;
  els.btnNextLabel.textContent = isLast ? "Finalizar" : "Siguiente";
  els.btnNextIcon.textContent = isLast ? "flag" : "arrow_forward";
}

// Avanza a la siguiente pregunta o termina el test
// [v1.7.0] En el modo instantáneo, si la pregunta todavía no se corrigió el botón la corrige ("Comprobar")
function goNext() {
  if (!quizActive || answers[current] === null) return;
  if (mode === "instant" && !checked[current]) {
    checkAnswer();
    return;
  }
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
// [v1.7.0] En el modo instantáneo no se puede volver atrás
function goPrev() {
  if (mode === "instant" || current <= minAllowedIndex()) return;
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
  setupLock(); // [v1.8.1] actualiza el aviso del candado (puede haberse desbloqueado durante el test)
  showScreen(els.screenStart);
}

/* =========================================================
   7) RESULTADOS (float con puntaje /10 y revisión)
   ========================================================= */

// Calcula las notas y abre el float de resultados.
// [v1.3.0] El test se puede terminar en cualquier momento ("Terminar test"): las preguntas sin contestar suman 0
// en el promedio general y no cuentan en el promedio de contestadas
// [v1.5.0] Si quedan preguntas sin contestar, antes de terminar pide confirmación en una ventana flotante
// [v1.7.0] Al terminar guarda el resultado completo en el historial. En el modo instantáneo solo cuentan las preguntas
// ya corregidas: una respuesta marcada pero sin "Comprobar" se toma como sin contestar
async function finishTest() {
  if (!quizActive) return; // evita terminar dos veces (por ejemplo, con un doble toque)
  const effective = mode === "instant" ? answers.map((a, i) => (checked[i] ? a : null)) : answers;
  const unanswered = questions.length - effective.filter((a) => a !== null).length;
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
  answers = effective;
  quizActive = false;
  setTag("FINALIZADO");
  setHardTheme(false); // [v1.7.0] los resultados vuelven al celeste

  const total = questions.length;
  // [v1.4.0] Puntos totales: cada pregunta aporta de 0 a 1 (la selección múltiple puede aportar un valor parcial)
  const points = questions.reduce((acc, q, i) => acc + questionCredit(q, answers[i]), 0);
  const answered = answers.filter((a) => a !== null).length;   // preguntas contestadas
  const incomplete = answered < total;                         // true si quedó alguna sin contestar
  const scoreAll = calcScore(points, total);                   // promedio general: las sin contestar suman 0
  const scoreAnswered = answered > 0 ? calcScore(points, answered) : null; // solo contestadas (null si no contestó ninguna)

  // [v1.7.0] Qué test fue, en qué modo y cuándo (se muestra en los resultados y se guarda en el historial)
  // [v1.9.0] La dificultad solo se guarda si el test tiene más de una (si no, no aporta nada)
  const origen = { nombre: currentTest.nombre, modo: mode, fecha: new Date().toISOString() };
  if (currentTest.nivelesLista.length > 1) origen.dificultad = level;
  addToHistory({
    id: Date.now(),
    ...origen,
    file: currentTest.file,
    scoreAll, scoreAnswered, points, answered, total, incomplete,
    preguntas: questions, // copia de las preguntas tal como se hicieron: el historial las muestra aunque el JSON cambie después
    respuestas: answers
  });

  buildReview(questions, answers);
  showFloat({ scoreAll, scoreAnswered, points, answered, total, incomplete, origen });
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
// [v1.7.0] Ahora recibe las preguntas y las respuestas a mostrar (así sirve tanto para un test recién terminado como
// para uno del historial) y suma la marca "Pregunta difícil" y el tipo de formación de palabras
function buildReview(qs, ans) {
  els.reviewList.textContent = "";

  qs.forEach((q, i) => {
    const chosen = ans[i];                              // [v1.4.0] lista de posiciones elegidas (o null)
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

    // [v1.7.0] Pregunta difícil: marca con calavera bajo el enunciado
    if (q.dificil) {
      const hard = document.createElement("p");
      hard.className = "review__hardtag";
      hard.append(icon("skull"), document.createTextNode("Pregunta difícil"));
      item.appendChild(hard);
    }

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
    } else if (q.tipo === "palabras") {
      // [v1.7.0] Formación de palabras: la respuesta armada (las palabras en el orden en que se pusieron) y, si falló, la correcta
      const armada = skipped ? "Sin responder" : chosen.map((id) => q.opciones[id]).join(" ");
      item.appendChild(answerLine("Tu respuesta", armada, skipped ? "skip" : full ? "ok" : "bad"));
      if (!full) item.appendChild(answerLine("Correcta", q.solucion.join(" "), "ok"));
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
// [v1.7.0] También recibe "origen" (nombre del test, modo y fecha) y "fromHistory" (true si se abrió desde el historial:
// en ese caso el botón "Menú" pasa a ser "Cerrar" y se oculta "Reintentar")
function showFloat({ scoreAll, scoreAnswered, points, answered, total, incomplete, origen = null, fromHistory = false }) {
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

  // [v1.7.0] De qué test es, en qué modo se hizo y cuándo ("Modelo OSI · Corrección final · 22/10/2026, 21:30")
  els.scoreSource.textContent = origen
    ? [origen.nombre, levelLabel(origen.dificultad), (MODOS[origen.modo] || MODOS.final).label, formatDate(origen.fecha)].filter(Boolean).join(" · ")
    : "";

  // [v1.7.0] Abierto desde el historial: "Cerrar" en lugar de "Menú" y sin "Reintentar"
  floatFromHistory = fromHistory;
  els.btnRetry.hidden = fromHistory;
  els.btnHomeIcon.textContent = fromHistory ? "close" : "apps";
  els.btnHomeLabel.textContent = fromHistory ? "Cerrar" : "Menú";

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
  (fromHistory ? els.btnHome : els.btnRetry).focus({ preventScroll: true }); // [v1.7.0] el foco va al botón que está visible

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
   7c) HISTORIAL  [v1.7.0]
   Los últimos HISTORY_MAX resultados se guardan en este dispositivo (localStorage), con una copia de las preguntas
   y de las respuestas, así que al abrirlos se ve exactamente el mismo panel de resultados del momento de terminar.
   ========================================================= */

// ¿Es un resultado guardado válido? Protege contra datos viejos o dañados en localStorage
function isValidRecord(r) {
  return !!r && typeof r === "object"
    && typeof r.scoreAll === "number" && typeof r.total === "number"
    && Array.isArray(r.preguntas) && r.preguntas.length > 0
    && Array.isArray(r.respuestas) && r.respuestas.length === r.preguntas.length;
}

// Lee el historial guardado (el más nuevo primero). Si localStorage no está disponible o los datos están rotos, devuelve []
function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter(isValidRecord).slice(0, HISTORY_MAX) : [];
  } catch (err) {
    return [];
  }
}

// Guarda el historial. Si no hay espacio en el dispositivo, prueba con un resultado menos (descarta el más viejo)
function saveHistory(list) {
  for (let n = list.length; n >= 1; n--) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, n)));
      return;
    } catch (err) {
      // sin espacio o almacenamiento bloqueado: se vuelve a intentar con uno menos
    }
  }
  console.warn("[Test] No se pudo guardar el historial en este dispositivo.");
}

// Agrega un resultado al principio del historial y conserva solo los últimos HISTORY_MAX
function addToHistory(record) {
  saveHistory([record, ...loadHistory()].slice(0, HISTORY_MAX));
}

// Escribe la cantidad de resultados guardados en el botón "Historial" del menú
function updateHistoryButton() {
  const n = loadHistory().length;
  els.btnHistoryLabel.textContent = n > 0 ? `Historial · ${n}` : "Historial";
}

// Abre la pantalla de historial
function showHistory() {
  hideFloat();
  quizActive = false;
  setTag("HISTORIAL");
  document.title = "Historial · Test";
  renderHistory();
  showScreen(els.screenHistory);
}

// Dibuja una tarjeta por cada resultado guardado: nota (verde / amarillo / rojo), test, fecha, modo y cantidad de correctas
function renderHistory() {
  const list = loadHistory();
  els.histNotice.hidden = list.length > 0;        // aviso "todavía no hay resultados"
  els.btnHistoryClear.hidden = list.length === 0; // sin resultados no hace falta "Borrar historial"
  els.histList.textContent = "";

  list.forEach((rec, i) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "test-card hist-card";
    card.style.animationDelay = `${i * 60}ms`;

    // Nota sobre 10, con el color del resultado
    const score = document.createElement("span");
    score.className = `hist-card__score hist-card__score--${scoreTone(rec.scoreAll)}`;
    const value = document.createElement("strong");
    value.textContent = formatScore(rec.scoreAll);
    const max = document.createElement("small");
    max.textContent = "/10";
    score.append(value, max);

    // Nombre del test, fecha · modo, y cantidad de correctas (+ "Incompleto" si quedó alguna sin contestar)
    const info = document.createElement("span");
    info.className = "test-card__info";

    const name = document.createElement("strong");
    name.className = "test-card__name";
    name.textContent = rec.nombre || "Test";
    info.appendChild(name);

    const when = document.createElement("span");
    when.className = "test-card__topic";
    when.textContent = [formatDate(rec.fecha), levelLabel(rec.dificultad), (MODOS[rec.modo] || MODOS.final).label].filter(Boolean).join(" · ");
    info.appendChild(when);

    const meta = document.createElement("small");
    meta.className = "test-card__meta";
    meta.textContent = `${formatPoints(rec.points)} de ${rec.total} correctas`;
    if (rec.incomplete) {
      const tag = document.createElement("span");
      tag.className = "hist-card__tag";
      tag.textContent = " · Incompleto";
      meta.appendChild(tag);
    }
    info.appendChild(meta);

    const chev = icon("chevron_right");
    chev.classList.add("test-card__chev");

    card.append(score, info, chev);
    card.addEventListener("click", () => openHistoryItem(rec));
    els.histList.appendChild(card);
  });
}

// Abre un resultado guardado en el mismo panel de resultados que aparece al terminar un test
function openHistoryItem(rec) {
  buildReview(rec.preguntas, rec.respuestas);
  showFloat({
    scoreAll: rec.scoreAll,
    scoreAnswered: typeof rec.scoreAnswered === "number" ? rec.scoreAnswered : null,
    points: rec.points,
    answered: rec.answered,
    total: rec.total,
    incomplete: !!rec.incomplete,
    origen: { nombre: rec.nombre, modo: rec.modo, fecha: rec.fecha },
    fromHistory: true
  });
}

// Borra todo el historial de este dispositivo (con confirmación)
async function clearHistory() {
  const n = loadHistory().length;
  if (n === 0) return;
  const ok = await askConfirm({
    icon: "delete",
    title: "¿Borrar el historial?",
    text: `Se ${n === 1 ? "borra el resultado guardado" : `borran los ${n} resultados guardados`} en este dispositivo. No se puede deshacer.`,
    okLabel: "Borrar",
    cancelLabel: "Cancelar"
  });
  if (!ok) return;
  try { localStorage.removeItem(HISTORY_KEY); } catch (err) { /* almacenamiento bloqueado: no hay nada que borrar */ }
  renderHistory();
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

els.levelBtns.forEach((b) => b.addEventListener("click", () => setLevel(b.dataset.level))); // [v1.9.0] switch de dificultad
els.btnStart.addEventListener("click", onStartClick); // [v1.8.1] pide la contraseña si el test la tiene
els.passToggle.addEventListener("click", () => setPinVisible(els.passToggle.getAttribute("aria-pressed") !== "true")); // [v1.8.1] ojo
els.passCancel.addEventListener("click", closePasswordModal); // [v1.8.1] cancelar la contraseña
els.btnChange.addEventListener("click", showMenu); // [v1.2.0] "Cambiar test"
els.btnBack.addEventListener("click", goBackToPreview); // [v1.5.2] flecha "Volver": sale del test (con confirmación)
els.btnPrev.addEventListener("click", goPrev);
els.btnNext.addEventListener("click", goNext);
els.btnFinish.addEventListener("click", finishTest); // [v1.3.0] "Terminar test": cierra el test cuando se quiera
els.btnRetry.addEventListener("click", retry);
// [v1.2.0] "Menú" del float: vuelve a elegir test. [v1.7.0] Si el resultado se abrió desde el historial es "Cerrar": solo cierra el panel
els.btnHome.addEventListener("click", () => (floatFromHistory ? hideFloat() : showMenu()));

// [v1.7.0] Historial: abrir desde el menú, volver al menú y borrar
els.btnHistory.addEventListener("click", showHistory);
els.btnHistoryBack.addEventListener("click", showMenu);
els.btnHistoryClear.addEventListener("click", clearHistory);

// [v1.7.0] Switch de modo de corrección (vista previa del test)
els.modeBtns.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));

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
  if (!els.passBox.hidden) { // [v1.8.1] con la ventana de contraseña abierta, solo Escape la cierra
    if (e.key === "Escape") closePasswordModal();
    return;
  }
  if (pendingConfirm) {
    if (e.key === "Escape") closeConfirm(false);
    return;
  }
  if (!quizActive || e.ctrlKey || e.metaKey || e.altKey) return;

  const key = e.key.toLowerCase();
  const q = questions[current];

  if (e.key === "ArrowLeft") { goPrev(); return; }
  if (e.key === "ArrowRight") { goNext(); return; }

  // [v1.7.0] Formación de palabras: no hay letras; "Retroceso" saca la última palabra puesta
  if (q.tipo === "palabras") {
    const placed = answers[current];
    if (e.key === "Backspace" && placed) removeWord(placed.length - 1);
    return;
  }

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
setMode("final");      // [v1.7.0] deja escrito el modo por defecto (corrección final) en el switch de la vista previa
updateHistoryButton(); // [v1.7.0] cantidad de resultados guardados en el botón "Historial"
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