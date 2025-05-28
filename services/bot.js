import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';

// Bot 1 (principal)
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

// Bot 2 (secundario)
const token1 = process.env.TELEGRAM_BOT_TOKEN1;
const chatId1 = process.env.TELEGRAM_CHAT_ID1;
const threadId1 = 4;

if (!token || !token1) {
  console.error('❌ Algún token de bot de Telegram no está definido.');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
const bot2 = new TelegramBot(token1, { polling: false }); // segundo bot sin polling

const enviarAmbos = async (mensaje, opciones = {}) => {
  try {
    await bot.sendMessage(chatId, mensaje, opciones);
    await bot2.sendMessage(chatId1, mensaje, { ...opciones, message_thread_id: threadId1 });
  } catch (err) {
    console.error('❌ Error al enviar a uno de los grupos:', err);
  }
};

bot.on('polling_error', (error) => {
  if (error.code === 'ETELEGRAM' && error.message.includes('409')) {
    console.error('Conflicto 409 detectado. Cerrando bot para evitar múltiples instancias.');
    process.exit(1);
  } else {
    console.error('Error de polling:', error);
  }
});

bot.onText(/\/top/, async () => {
  try {
    const res = await fetch('http://ligavelocidrone.onrender.com/api/enviar-ranking-telegram');
    const json = await res.json();

    if (!json.ok) {
      await enviarAmbos(`❌ Error al obtener el ranking: ${json.error || json.message}`);
      return;
    }

    await enviarAmbos('✅ Ranking semanal enviado al grupo!');
  } catch (error) {
    await enviarAmbos('❌ Error al solicitar el ranking semanal.');
  }
});

bot.onText(/\/supertop/, async () => {
  try {
    const res = await fetch('https://ligavelocidrone.onrender.com/api/enviar-ranking-anual');
    const json = await res.json();

    const dataArray = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : null);

    if (!dataArray) {
      await enviarAmbos('⚠️ La clasificación anual está vacía o no disponible.');
      return;
    }

    const texto = dataArray.map((jugador, i) => {
      const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🍬';
      return `${medalla} <b>${jugador.nombre}</b> — <i>${jugador.puntos_anuales} pts</i>`;
    }).join('\n');

    await enviarAmbos(`<b>🏆 Clasificación Anual 🏆</b>\n\n${texto}`, { parse_mode: 'HTML' });

  } catch (error) {
    await enviarAmbos('❌ Error al solicitar la clasificación anual.');
  }
});

bot.onText(/\/tracks/, async () => {
  try {
    const res = await fetch('https://ligavelocidrone.onrender.com/api/configuracion');
    const json = await res.json();

    if (!json?.track1_nombreEscenario || !json?.track1_nombrePista || !json?.track2_nombreEscenario || !json?.track2_nombrePista) {
      await enviarAmbos('⚠️ Configuración de tracks no encontrada o incompleta.');
      return;
    }

    const texto =
      `<b>Track 1:</b>\n` +
      `Race Mode: Single Class\n` +
      `Escenario: ${json.track1_nombreEscenario}\n` +
      `Track: ${json.track1_nombrePista}\n\n` +
      `<b>Track 2:</b>\n` +
      `Race Mode: Three Lap Race\n` +
      `Escenario: ${json.track2_nombreEscenario}\n` +
      `Track: ${json.track2_nombrePista}`;

    await enviarAmbos(texto, { parse_mode: 'HTML' });

  } catch (error) {
    await enviarAmbos('❌ Error al solicitar los tracks semanales.');
  }
});

bot.onText(/\/help/, async () => {
  const texto =
    `<b>🤖 Comandos disponibles:</b>\n\n` +
    `<b>/top</b> - Envía el ranking semanal al grupo.\n` +
    `<b>/supertop</b> - Muestra la clasificación anual actual.\n` +
    `<b>/tracks</b> - Muestra los escenarios y nombres de pista semanales.\n` +
    `<b>/help</b> - Muestra esta ayuda.\n\n` +
    `Usa los comandos escribiéndolos en el chat, por ejemplo: <code>/top</code>`;

  await bot.sendMessage(chatId, texto, { parse_mode: 'HTML' });
});

console.log('🤖 Bot activo escuchando comandos y enviando a dos grupos');
