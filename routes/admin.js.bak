// routes/admin.js
import express from 'express';
import basicAuth from 'express-basic-auth';
import supabase from '../supabaseClient.js';
import fetch from 'node-fetch';
import multer from 'multer';

const router = express.Router();

// ─── Configuración de Multer en memoria para recibir la foto ───
const upload = multer(); // No hay destino en disco; dejamos el buffer en memoria

// ─── Autenticación básica para las rutas /admin y /admin/update-tracks ───
const auth = basicAuth({
  users: { [process.env.ADMIN_USER]: process.env.ADMIN_PASS },
  challenge: true
});
router.use('/admin', auth);
router.use('/admin/update-tracks', auth);

// ─── GET /admin → servir panel de administración estático ───
router.get('/admin', (_req, res) => {
  res.sendFile('admin.html', { root: './public' });
});

// ─── POST /admin/update-tracks ───
// Actualiza los IDs de Track 1 y Track 2 en Supabase + suma puntos anuales
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

    // 2) Llamada al RPC para incrementar ranking anual
    const { error: rpcError } = await supabase.rpc('incrementar_ranking_anual');
    if (rpcError) throw rpcError;

    // 3) Respondemos al cliente (el frontend admin.js) 
    //    El envío a Telegram se hará desde el cliente tras esta respuesta
    res.status(200).json({ mensaje: '✅ Tracks actualizados y puntos añadidos al ranking anual' });
  } catch (err) {
    console.error('❌ Error en update-tracks:', err.message);
    res.status(500).json({ error: 'Error al actualizar tracks o ranking anual' });
  }
});

// ─── POST /admin/send-foto-top3 ───
// Recibe la foto generada en el cliente (blob) y la envía a Telegram con sendPhoto
router.post('/admin/send-foto-top3', upload.single('imagen'), async (req, res) => {
  try {
    // 1) Validar que llega un archivo (en req.file.buffer)
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ ok: false, error: 'No se recibió la imagen.' });
    }

    // 2) Obtener el thread_id (viene en req.body.thread_id o por defecto 4)
    const threadId = parseInt(req.body.thread_id, 10) || 4;

    // 3) Credenciales de Telegram (solo BOT_TOKEN1 y CHAT_ID1)
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN1;
    const CHAT_ID  = process.env.TELEGRAM_CHAT_ID1;
    if (!BOT_TOKEN || !CHAT_ID) {
      throw new Error('Faltan TELEGRAM_BOT_TOKEN1 o TELEGRAM_CHAT_ID1 en variables de entorno.');
    }

    // 4) Construir FormData para la llamada a sendPhoto
    const formData = new fetch.FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('photo', Buffer.from(req.file.buffer), {
      filename: 'podium_top3.jpg',
      contentType: req.file.mimetype
    });
    formData.append('caption', '🏆 Top 3 de la semana!');
    formData.append('parse_mode', 'HTML');
    formData.append('message_thread_id', threadId);

    // 5) Petición a la API de Telegram
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

// ─── POST /api/commit-ranking ───
// (Mantenemos exactamente esta función que ya tenías)
router.post('/api/commit-ranking', async (req, res) => {
  try {
    // 1) Incrementar ranking anual en Supabase
    const { error: rpcError } = await supabase.rpc('incrementar_ranking_anual');
    if (rpcError) throw rpcError;

    // 2) Enviar ranking semanal como texto a Telegram
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
