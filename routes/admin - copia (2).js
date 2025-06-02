// admin.js (modificado)
import express from 'express';
import basicAuth from 'express-basic-auth';
import supabase from '../supabaseClient.js';
import fetch from 'node-fetch';

const router = express.Router();

// Autenticación básica para /admin y /admin/update-tracks
const auth = basicAuth({
  users: { [process.env.ADMIN_USER]: process.env.ADMIN_PASS },
  challenge: true
});
router.use('/admin', auth);
router.use('/admin/update-tracks', auth);

// Servir panel de admin
router.get('/admin', (_req, res) => {
  res.sendFile('admin.html', { root: './public' });
});

// Actualizar tracks y sumar puntos anuales
router.post('/admin/update-tracks', async (req, res) => {
  try {
    const { track1_escena, track1_pista, track2_escena, track2_pista } = req.body;
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
    const { error: rpcError } = await supabase.rpc('incrementar_ranking_anual');
    if (rpcError) throw rpcError;
    res.status(200).json({ mensaje: '✅ Tracks actualizados y puntos añadidos al ranking anual' });
  } catch (err) {
    console.error('❌ Error en update-tracks:', err.message);
    res.status(500).json({ error: 'Error al actualizar tracks o ranking anual' });
  }
});

// Commit del ranking semanal al anual y envío a Telegram
router.post('/api/commit-ranking', async (req, res) => {
  try {
    // Incrementar ranking anual en Supabase
    const { error: rpcError } = await supabase.rpc('incrementar_ranking_anual');
    if (rpcError) throw rpcError;

    // Enviar ranking semanal a Telegram
    const resp = await fetch('http://ligavelocidrone.onrender.com/api/enviar-ranking-telegram');
    const data = await resp.json();
    if (!data.ok) throw new Error(data.error || data.message || 'Error al enviar a Telegram');

    res.json({ ok: true, message: '✅ Commit realizado: puntos incrementados y ranking enviado a Telegram' });
  } catch (err) {
    console.error('❌ Error en commit-ranking:', err.message);
    res.status(500).json({ ok: false, error: 'Error al hacer commit del ranking: ' + err.message });
  }
});

export default router;
