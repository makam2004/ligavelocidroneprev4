// bot.js
import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN1;
const CHAT_ID  = process.env.TELEGRAM_CHAT_ID1;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error('❌ Faltan las variables de entorno TELEGRAM_BOT_TOKEN1 y/o TELEGRAM_CHAT_ID1');
  process.exit(1);
}

// Inicializamos el bot en modo polling
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.on('polling_error', (error) => {
  if (error.code === 'ETELEGRAM' && error.message.includes('409')) {
    console.error('Conflicto 409 detectado. Cerrando bot para evitar múltiples instancias.');
    process.exit(1);
  } else {
    console.error('Error de polling:', error);
  }
});

// Función auxiliar para calcular semana actual
function calcularSemanaActual() {
  const fecha = new Date();
  const inicio = new Date(fecha.getFullYear(), 0, 1);
  const dias = Math.floor((fecha - inicio) / 86400000);
  return Math.ceil((dias + inicio.getDay() + 1) / 7);
}

// Comando /top → envía el ranking semanal (TOP 3 de cada pista)
bot.onText(/\/top/, async () => {
  try {
    // 1) Obtenemos los datos de /api/tiempos-mejorados
    const res = await fetch('https://ligavelocidrone.onrender.com/api/tiempos-mejorados');
    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error('Formato de datos de tiempos no válido');
    }

    // 2) Constrimos el mensaje con TOP 3 de cada pista
    const semana = calcularSemanaActual();
    let mensaje = `🏁 <b>Resultados Semanales - Semana ${semana}</b>\n`;

    data.forEach((pistaObj, idx) => {
      const encabezado = idx === 0
        ? 'Track 1 – Race Mode: Single Class'
        : 'Track 2 – 3 Lap: Single Class';
      mensaje += `\n📍 <b>${encabezado}</b>\n`;
      // Tomamos los 3 primeros resultados
      pistaObj.resultados.slice(0, 3).forEach((r, i) => {
        mensaje += `${i + 1}. <b>${r.jugador}</b> — <code>${r.tiempo.toFixed(2)} s</code>\n`;
      });
      mensaje += '\n';
    });

    // 3) Enviamos el mensaje a CHAT_ID
    await bot.sendMessage(CHAT_ID, mensaje, { parse_mode: 'HTML' });
    console.log('✅ /top enviado a grupo', CHAT_ID);
  } catch (error) {
    console.error('❌ Error en /top:', error);
    await bot.sendMessage(CHAT_ID, `⚠️ No se pudo obtener el ranking semanal:\n${error.message}`);
  }
});

// Comando /supertop → envía la clasificación anual
bot.onText(/\/supertop/, async () => {
  try {
    // 1) Obtenemos los datos de /api/enviar-ranking-anual
    const res = await fetch('https://ligavelocidrone.onrender.com/api/enviar-ranking-anual');
    const json = await res.json();

    let dataArray = null;
    if (json && json.ok && Array.isArray(json.data)) {
      dataArray = json.data;
    } else if (Array.isArray(json)) {
      dataArray = json;
    }

    if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) {
      await bot.sendMessage(CHAT_ID, '⚠️ La clasificación anual está vacía o no disponible.');
      return;
    }

    // 2) Construimos el texto con medallas
    const encabezado = `<b>🏆 Clasificación Anual 🏆</b>\n\n`;
    const lineas = dataArray.map((jugador, i) => {
      const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🎖️';
      return `${medalla} <b>${jugador.nombre}</b> — <i>${jugador.puntos_anuales} pts</i>`;
    }).join('\n');

    const mensaje = encabezado + lineas;

    // 3) Enviamos el mensaje a CHAT_ID
    await bot.sendMessage(CHAT_ID, mensaje, { parse_mode: 'HTML' });
    console.log('✅ /supertop enviado a grupo', CHAT_ID);
  } catch (error) {
    console.error('❌ Error en /supertop:', error);
    await bot.sendMessage(CHAT_ID, `⚠️ No se pudo obtener la clasificación anual:\n${error.message}`);
  }
});

// Comando /tracks → envía la configuración de los tracks semanales
bot.onText(/\/tracks/, async () => {
  try {
    // 1) Obtenemos los datos de /api/configuracion
    const res = await fetch('https://ligavelocidrone.onrender.com/api/configuracion');
    const json = await res.json();

    if (!json
      || !json.track1_nombreEscenario
      || !json.track1_nombrePista
      || !json.track2_nombreEscenario
      || !json.track2_nombrePista
    ) {
      await bot.sendMessage(CHAT_ID, '⚠️ Configuración de tracks no encontrada o incompleta.');
      return;
    }

    // 2) Construimos el texto con la info de los tracks
    const texto = 
      `<b>Track 1:</b>\n` +
      `Race Mode: Single Class\n` +
      `Escenario: ${json.track1_nombreEscenario}\n` +
      `Track: ${json.track1_nombrePista}\n\n` +
      `<b>Track 2:</b>\n` +
      `3 Lap: Single Class\n` +
      `Escenario: ${json.track2_nombreEscenario}\n` +
      `Track: ${json.track2_nombrePista}`;

    // 3) Enviamos el mensaje a CHAT_ID
    await bot.sendMessage(CHAT_ID, texto, { parse_mode: 'HTML' });
    console.log('✅ /tracks enviado a grupo', CHAT_ID);
  } catch (error) {
    console.error('❌ Error en /tracks:', error);
    await bot.sendMessage(CHAT_ID, `⚠️ No se pudo obtener los tracks semanales:\n${error.message}`);
  }
});

// Comando /help → envía la lista de comandos disponibles
bot.onText(/\/help/, async () => {
  const texto =
    `<b>🤖 Comandos disponibles:</b>\n\n` +
    `<b>/top</b> - Envía el ranking semanal (TOP 3 de cada pista).\n` +
    `<b>/supertop</b> - Muestra la clasificación anual actual.\n` +
    `<b>/tracks</b> - Muestra los escenarios y nombres de pista semanales.\n` +
    `<b>/help</b> - Muestra esta ayuda.\n\n` +
    `Para ejecutar un comando, escríbelo en el chat.`;

  await bot.sendMessage(CHAT_ID, texto, { parse_mode: 'HTML' });
  console.log('✅ /help enviado a grupo', CHAT_ID);
});

console.log('🤖 Bot activo con TOKEN1, escuchando comandos /top, /supertop, /tracks y /help');```

**Resumen de los cambios clave**:

- Se eliminó todo uso de `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`. Ahora sólo se usa:
  ```bash
  TELEGRAM_BOT_TOKEN1=<token entregado por BotFather>
  TELEGRAM_CHAT_ID1=<chat_id del grupo donde el bot escribirá>
