import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { getTopRanking, getTracksActuales } from '../routes/tiemposMejorados.js'; // Rutas existentes

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN1, { polling: true });

bot.onText(/\/top/, async () => {
  try {
    const ranking = await getTopRanking();

    let mensaje = '📊 *Ranking Semanal:*\n\n';
    ranking.forEach((jugador, index) => {
      const icono = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🍬';
      mensaje += `${icono} *${jugador.nombre}* - ${jugador.puntos} pts\n`;
    });

    await bot.sendMessage(process.env.TELEGRAM_CHAT_ID1, mensaje, {
      parse_mode: 'Markdown',
      message_thread_id: 4
    });
  } catch (error) {
    console.error('❌ Error en /top:', error.message);
  }
});

bot.onText(/\/tracks/, async () => {
  try {
    const tracks = await getTracksActuales();

    let mensaje = '🏁 *Tracks actuales:*\n\n';
    tracks.forEach((track, index) => {
      const encabezado = index === 0
        ? '*Single Class - Laps -*'
        : '*Single Class - Three Lap Race -*';
      mensaje += `${encabezado}\n🏟️ *Escenario:* ${track.escenario}\n🛣️ *Track:* ${track.nombre}\n\n`;
    });

    await bot.sendMessage(process.env.TELEGRAM_CHAT_ID1, mensaje, {
      parse_mode: 'Markdown',
      message_thread_id: 4
    });
  } catch (error) {
    console.error('❌ Error en /tracks:', error.message);
  }
});

export default bot;
