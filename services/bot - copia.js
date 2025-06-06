import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN no está definido');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

bot.on('polling_error', (error) => {
  if (error.code === 'ETELEGRAM' && error.message.includes('409')) {
    console.error('Conflicto 409 detectado. Cerrando bot para evitar múltiples instancias.');
    process.exit(1);
  } else {
    console.error('Error de polling:', error);
  }
});

bot.onText(/\/top/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const res = await fetch('http://ligavelocidrone.onrender.com/api/enviar-ranking-telegram');
    const json = await res.json();

    if (!json.ok) {
      await bot.sendMessage(chatId, `Error al obtener el ranking: ${json.error || json.message}`);
      return;
    }

    await bot.sendMessage(chatId, '✅ Ranking semanal enviado al grupo!');
  } catch (error) {
    await bot.sendMessage(chatId, '❌ Error al solicitar el ranking.');
  }
});

bot.onText(/\/supertop/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const res = await fetch('https://ligavelocidrone.onrender.com/api/enviar-ranking-anual');
    const json = await res.json();

    let dataArray = null;

    if (json && json.ok && Array.isArray(json.data)) {
      dataArray = json.data;
    } else if (Array.isArray(json)) {
      dataArray = json;
    }

    if (!dataArray || !Array.isArray(dataArray)) {
      await bot.sendMessage(chatId, '⚠️ La clasificación anual está vacía o no disponible.');
      return;
    }

    const texto = dataArray.map((jugador, i) => {
      const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🎖️';
      return `${medalla} <b>${jugador.nombre}</b> — <i>${jugador.puntos_anuales} pts</i>`;
    }).join('\n');

    await bot.sendMessage(chatId, `<b>🏆 Clasificación Anual 🏆</b>\n\n${texto}`, { parse_mode: 'HTML' });

  } catch (error) {
    await bot.sendMessage(chatId, '❌ Error al solicitar la clasificación anual.');
  }
});

bot.onText(/\/tracks/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const res = await fetch('https://ligavelocidrone.onrender.com/api/configuracion');
    const json = await res.json();

    if (!json || !json.track1_nombreEscenario || !json.track1_nombrePista ||
        !json.track2_nombreEscenario || !json.track2_nombrePista) {
      await bot.sendMessage(chatId, '⚠️ Configuración de tracks no encontrada o incompleta.');
      return;
    }

    const texto = 
      `<b>Track 1:</b>\n` +
      `Race Mode: Single Class\n` +
      `Escenario: ${json.track1_nombreEscenario}\n` +
      `Track: ${json.track1_nombrePista}\n\n` +
      `<b>Track 2:</b>\n` +
      `3 Lap: Single Class\n` +
      `Escenario: ${json.track2_nombreEscenario}\n` +
      `Track: ${json.track2_nombrePista}`;

    await bot.sendMessage(chatId, texto, { parse_mode: 'HTML' });

  } catch (error) {
    await bot.sendMessage(chatId, '❌ Error al solicitar los tracks semanales.');
  }
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const texto =
    `<b>🤖 Comandos disponibles:</b>\n\n` +
    `<b>/top</b> - Envía el ranking semanal al grupo.\n` +
    `<b>/supertop</b> - Muestra la clasificación anual actual.\n` +
    `<b>/tracks</b> - Muestra los escenarios y nombres de pista semanales.\n` +
    `<b>/help</b> - Muestra esta ayuda.\n\n` +
    `Usa los comandos escribiéndolos en el chat, por ejemplo: <code>/top</code>`;

  await bot.sendMessage(chatId, texto, { parse_mode: 'HTML' });
});

console.log('🤖 Bot activo, escuchando comandos /top, /supertop, /tracks y /help');
