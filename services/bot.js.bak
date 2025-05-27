import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';

if (process.env.RUN_BOT !== 'true') {
  console.log('Bot deshabilitado en esta instancia');
  process.exit(0);
}

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN no está definido');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

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
    const res = await fetch('http://ligavelocidrone.onrender.com/api/enviar-ranking-anual');
    const json = await res.json();

    if (!json.ok) {
      await bot.sendMessage(chatId, `Error al obtener la clasificación anual: ${json.error || json.message}`);
      return;
    }

    await bot.sendMessage(chatId, '✅ Clasificación anual enviada al grupo!');
  } catch (error) {
    await bot.sendMessage(chatId, '❌ Error al solicitar la clasificación anual.');
  }
});

bot.onText(/\/tracks/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const res = await fetch('http://ligavelocidrone.onrender.com/api/configuracion');
    const json = await res.json();

    if (!json) {
      await bot.sendMessage(chatId, '❌ No se pudo obtener la configuración actual.');
      return;
    }

    const texto = `🏁 <b>Track 1:</b> Race Mode: Single Class - ${json.track1_escena} - ${json.track1_pista}\n` +
                  `⏱️ <b>Track 2:</b> 3 Lap: Single Class - ${json.track2_escena} - ${json.track2_pista}`;

    await bot.sendMessage(chatId, texto, { parse_mode: 'HTML' });
  } catch (error) {
    await bot.sendMessage(chatId, '❌ Error al solicitar los tracks semanales.');
  }
});

console.log('🤖 Bot activo, escuchando comandos /top, /supertop y /tracks');
