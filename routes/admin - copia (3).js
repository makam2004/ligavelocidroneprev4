// routes/admin.js
import express from 'express';
import basicAuth from 'express-basic-auth';
import supabase from '../supabaseClient.js';
import fetch from 'node-fetch';
import FormData from 'form-data';      // ← Importamos FormData desde 'form-data'
import multer from 'multer';

const router = express.Router();

// Multer en memoria para recibir la foto
const upload = multer();

// Autenticación básica para /admin y /admin/update-tracks
const auth = basicAuth({
  users: { [process.env.ADMIN_USER]: process.env.ADMIN_PASS },
  challenge: true
});
router.use('/admin', auth);
router.use('/admin/update-tracks', auth);

// Servir panel de admin (archivo estático en /public)
router.get('/admin', (_req, res) => {
  res.sendFile('admin.html', { root: './public' });
});

// POST /admin/update-tracks
//   - Upserta configuración en Supabase
//   - Intenta llamar al RPC 'incrementar_ranking_anual', pero si falla por "relation does not exist", lo ignora
router.post('/admin/update-tracks', async (req, res) => {
  try {
    const { track1_escena, track1_pista, track2_escena, track2_pista } = req.body;

    // 1) Upsert en tabla configuracion
    await supabase
      .from('configuracion')
      .upsert([{
        id: 1,
        track1_escena,
        track1_pista,
        track2_escena,
        track2_pista,
        fecha_actualizacion: new Date().toISOString()
      }], { onConflict: ['id'] });

    // 2) Intentar incrementar ranking anual, pero si no existe, capturamos y seguimos
    try {
      const { error: rpcError } = await supabase.rpc('incrementar_ranking_anual');
      if (rpcError) {
        const msg = rpcError.message || '';
        if (!msg.includes('relation "ranking_anual" does not exist')) {
          throw rpcError;
        }
        console.warn('⚠️ Se omitió incrementar ranking_anual: ', msg);
      }
    } catch (rpcCatch) {
      const msg = (rpcCatch.message || '').toLowerCase();
      if (msg.includes('relation "ranking_anual" does not exist')) {
        console.warn('⚠️ Se omitió incrementar ranking_anual (tabla no existe).');
      } else {
        throw rpcCatch;
      }
    }

    // 3) Responder al cliente (el frontend/admin.js)
    res.status(200).json({ mensaje: '✅ Tracks actualizados correctamente.' });
  } catch (err) {
    console.error('❌ Error en update-tracks:', err.message);
    res.status(500).json({ error: 'Error al actualizar tracks: ' + err.message });
  }
});

// POST /admin/send-foto-top3
//   - Recibe la imagen generada en el cliente y la envía a Telegram con sendPhoto
router.post('/admin/send-foto-top3', upload.single('imagen'), async (req, res) => {
  try {
    // 1) Validar que haya un archivo (en req.file.buffer)
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ ok: false, error: 'No se recibió la imagen.' });
    }

    // 2) Obtener el thread_id (viene en req.body.thread_id o por defecto 4)
    const threadId = parseInt(req.body.thread_id, 10) || 4;

    // 3) Credenciales de Telegram
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN1;
    const CHAT_ID  = process.env.TELEGRAM_CHAT_ID1;
    if (!BOT_TOKEN || !CHAT_ID) {
      throw new Error('Faltan TELEGRAM_BOT_TOKEN1 o TELEGRAM_CHAT_ID1 en variables de entorno.');
    }

    // 4) Construir un FormData de 'form-data' para llamar a sendPhoto
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('photo', Buffer.from(req.file.buffer), {
      filename: 'podium_top3.jpg',
      contentType: req.file.mimetype
    });
    formData.append('caption', '🏆 Top 3 de la semana!');
    formData.append('parse_mode', 'HTML');
    formData.append('message_thread_id', threadId);

    // 5) Petición a Telegram para enviar la foto
    const responseTelegram = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
      {
        method: 'POST',
        body: formData
      }
    );
    const jsonTelegram = await responseTelegram.json();
    if (!jsonTelegram.ok) {
      console.error('Error enviando foto a Telegram:', jsonTelegram);
      throw new Error(jsonTelegram.description || 'Falla en sendPhoto');
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('❌ Error en /admin/send-foto-top3 →', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/commit-ranking
//   - Tal cual lo tenías antes, sin modificaciones
router.post('/api/commit-ranking', async (_req, res) => {
  try {
    const { error: rpcError } = await supabase.rpc('incrementar_ranking_anual');
    if (rpcError) throw rpcError;

    const resp = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/enviar-ranking-telegram`);
    const data = await resp.json();
    if (!data.ok) throw new Error(data.error || data.message || 'Error al enviar a Telegram');

    res.json({ ok: true, message: '✅ Commit realizado: puntos incrementados y ranking enviado a Telegram' });
  } catch (err) {
    console.error('❌ Error en commit-ranking:', err.message);
    res.status(500).json({ ok: false, error: 'Error al hacer commit del ranking: ' + err.message });
  }
});

export default router;
