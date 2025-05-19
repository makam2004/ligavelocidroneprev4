import express from 'express';
import fetch from 'node-fetch';
import supabase from '../supabaseClient.js';

const router = express.Router();

router.get('/api/enviar-ranking-telegram', async (req, res) => {
  try {
    const { data: tracks, error: errTracks } = await supabase
      .from('tracks')
      .select('nombre')
      .eq('activo', true);

    const { data: ranking, error: errRanking } = await supabase
      .from('jugadores')
      .select('nombre, puntos_semanales')
      .order('puntos_semanales', { ascending: false })
      .limit(10);

    if (errTracks || errRanking) throw errTracks || errRanking;

    let mensaje = '🏁 *Tracks actuales:*
';
    mensaje += tracks.map(t => `- ${t.nombre}`).join('\n');
    mensaje += '\n\n📊 *Ranking Semanal:*
';
    ranking.forEach((j, i) => {
      mensaje += `${i + 1}. ${j.nombre} - ${j.puntos_semanales} pts\n`;
    });

    const telegramURL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(telegramURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: mensaje,
        parse_mode: 'Markdown'
      })
    });

    const json = await response.json();
    if (!json.ok) throw new Error('Telegram error: ' + json.description);

    res.json({ ok: true, enviado: true });
  } catch (err) {
    console.error('Error enviando ranking a Telegram:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;