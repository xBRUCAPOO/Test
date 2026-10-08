const QUESTIONS = [

  {
    pregunta: "¿Para qué sirve el comando dir?",
    opciones: [
      "Mostrar archivos y carpetas",
      "Mostrar la dirección MAC",
      "Consultar el DNS",
      "Mostrar conexiones de red"
    ],
    correcta: 0
  },

  {
    pregunta: "¿Qué información muestra el comando pwd?",
    opciones: [
      "La dirección IP",
      "La ubicación o ruta actual",
      "La dirección MAC",
      "Las conexiones activas"
    ],
    correcta: 1
  },

  {
    pregunta: "¿Para qué sirve el comando getmac?",
    opciones: [
      "Mostrar la dirección IP",
      "Mostrar la dirección MAC",
      "Mostrar la ruta de red",
      "Consultar el DNS"
    ],
    correcta: 1
  },

  {
    pregunta: "¿Qué significa MAC en una tarjeta de red?",
    opciones: [
      "Media Access Control",
      "Machine Access Connection",
      "Main Address Computer",
      "Microsoft Access Control"
    ],
    correcta: 0
  },

  {
    pregunta: "¿Para qué sirve ipconfig?",
    opciones: [
      "Mostrar archivos de una carpeta",
      "Mostrar la configuración de red",
      "Consultar un dominio DNS",
      "Mostrar programas instalados"
    ],
    correcta: 1
  },

  {
    pregunta: "¿Qué información puede mostrar ipconfig?",
    opciones: [
      "IP, máscara de subred y puerta de enlace",
      "Contraseñas guardadas",
      "Programas abiertos",
      "Archivos del sistema"
    ],
    correcta: 0
  },

  {
    pregunta: "¿Cuál es la forma correcta de obtener información detallada con ipconfig?",
    opciones: [
      "ipconfig\\all",
      "ipconfig-all",
      "ipconfig /all",
      "ipconfig.all"
    ],
    correcta: 2
  },

  {
    pregunta: "¿Qué ocurre si ejecutamos tracert sin indicar un destino?",
    opciones: [
      "Muestra la dirección MAC",
      "Muestra la ayuda y las opciones del comando",
      "Muestra automáticamente Google",
      "Apaga la conexión a Internet"
    ],
    correcta: 1
  },

  {
    pregunta: "¿Para qué sirve tracert?",
    opciones: [
      "Mostrar la ruta que sigue una conexión hasta un destino",
      "Mostrar los archivos de una carpeta",
      "Consultar la dirección MAC",
      "Cambiar la dirección IP"
    ],
    correcta: 0
  },

  {
    pregunta: "¿Qué representa cada salto en un tracert?",
    opciones: [
      "Un archivo del sistema",
      "Un dispositivo o router intermedio",
      "Una contraseña",
      "Una dirección MAC local"
    ],
    correcta: 1
  },

  {
    pregunta: "¿Qué comando utilizarías para rastrear la ruta hasta Google?",
    opciones: [
      "tracert google.com",
      "dir google.com",
      "getmac google.com",
      "pwd google.com"
    ],
    correcta: 0
  },

  {
    pregunta: "¿Para qué sirve netstat?",
    opciones: [
      "Mostrar conexiones de red",
      "Mostrar carpetas",
      "Consultar DNS",
      "Mostrar la ruta de una conexión"
    ],
    correcta: 0
  },

  {
    pregunta: "¿Qué significa ESTABLISHED en netstat?",
    opciones: [
      "La conexión fue bloqueada",
      "La conexión está establecida",
      "La conexión nunca existió",
      "El equipo está apagado"
    ],
    correcta: 1
  },

  {
    pregunta: "¿Qué significa TIME_WAIT en netstat?",
    opciones: [
      "Una conexión está esperando mientras termina de cerrarse",
      "Una conexión está establecida permanentemente",
      "No existe ninguna conexión",
      "El DNS está funcionando"
    ],
    correcta: 0
  },

  {
    pregunta: "¿Qué significa CLOSE_WAIT en netstat?",
    opciones: [
      "La conexión está esperando para comenzar",
      "El otro extremo cerró la conexión y el equipo está terminando de cerrarla",
      "La conexión está completamente establecida",
      "El DNS respondió correctamente"
    ],
    correcta: 1
  },

  {
    pregunta: "¿Qué significa 127.0.0.1?",
    opciones: [
      "La IP pública de Google",
      "La dirección de localhost",
      "La dirección del router",
      "La dirección del servidor DNS"
    ],
    correcta: 1
  },

  {
    pregunta: "¿Qué significa localhost?",
    opciones: [
      "Otro equipo de Internet",
      "El propio equipo",
      "El router de la red",
      "El servidor DNS"
    ],
    correcta: 1
  },

  {
    pregunta: "¿Qué es DNS?",
    opciones: [
      "Un tipo de tarjeta de red",
      "Un sistema que relaciona nombres de dominio con direcciones IP",
      "Un protocolo para mostrar archivos",
      "Una dirección MAC"
    ],
    correcta: 1
  },

  {
    pregunta: "¿Qué significa DNS?",
    opciones: [
      "Domain Name System",
      "Digital Network Service",
      "Data Name Server",
      "Domain Network Security"
    ],
    correcta: 0
  },

  {
    pregunta: "¿Para qué sirve nslookup?",
    opciones: [
      "Consultar información de DNS",
      "Mostrar archivos",
      "Mostrar la dirección MAC",
      "Mostrar la carpeta actual"
    ],
    correcta: 0
  },

  {
    pregunta: "¿Qué comando usarías para averiguar qué IP corresponde a google.com?",
    opciones: [
      "netstat google.com",
      "nslookup google.com",
      "getmac google.com",
      "pwd google.com"
    ],
    correcta: 1
  },

  {
    pregunta: "¿Qué hace principalmente un servidor DNS?",
    opciones: [
      "Traduce nombres de dominio a direcciones IP",
      "Crea carpetas automáticamente",
      "Muestra la dirección MAC",
      "Controla los archivos de Windows"
    ],
    correcta: 0
  },

  {
    pregunta: "En una dirección como 192.168.0.198, ¿qué representa?",
    opciones: [
      "Una dirección IP",
      "Una dirección MAC",
      "Un puerto",
      "Un nombre DNS"
    ],
    correcta: 0
  },

  {
    pregunta: "¿Qué es 192.168.0.1 en una red doméstica normalmente?",
    opciones: [
      "Una dirección MAC",
      "La puerta de enlace o router",
      "El servidor de Google",
      "Una dirección DNS pública"
    ],
    correcta: 1
  },

  {
    pregunta: "¿Qué indica la máscara de subred 255.255.255.0?",
    opciones: [
      "Información sobre cómo se divide la red",
      "La dirección MAC del equipo",
      "El nombre del usuario",
      "El puerto HTTPS"
    ],
    correcta: 0
  },

  {
    pregunta: "¿Qué comando muestra la dirección física de una interfaz de red?",
    opciones: [
      "pwd",
      "tracert",
      "getmac",
      "nslookup"
    ],
    correcta: 2
  },

  {
    pregunta: "¿Qué comando muestra la ubicación actual en PowerShell?",
    opciones: [
      "pwd",
      "dir",
      "netstat",
      "getmac"
    ],
    correcta: 0
  },

  {
    pregunta: "¿Qué comando permite ver las conexiones TCP activas?",
    opciones: [
      "dir",
      "netstat",
      "pwd",
      "nslookup"
    ],
    correcta: 1
  },

  {
    pregunta: "Si querés saber por dónde viaja tu conexión hasta un servidor, ¿qué comando usarías?",
    opciones: [
      "ipconfig",
      "getmac",
      "tracert",
      "dir"
    ],
    correcta: 2
  },

  {
    pregunta: "¿Cuál de estas relaciones entre comando y función es correcta?",
    opciones: [
      "dir → conexiones de red",
      "getmac → dirección MAC",
      "tracert → archivos y carpetas",
      "nslookup → ubicación actual"
    ],
    correcta: 1
  }

];