// index.js (en la raíz del proyecto)

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch'; // IMPORTANTE para verificar hCaptcha en Node
import supabase from './supabaseClient.js';

import tiemposMejorados from './routes/tiemposMejorados.js';
import adminRoutes from './routes/admin.js';
import rankingRoutes from './routes/ranking.js';
import commitRankingRoutes from './routes/commit_ranking.js';
import telegramRoutes from './routes/telegram.js';
import checkMejoras from './routes/checkMejoras.js';
import rankingAnualRouter from './routes/rankingAnual.js'; // ════════════════════════════════════════
import configuracionRouter from './routes/configuracion.js';
import './services/bot.js';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────── Middleware ───────────

// 1) Servir la carpeta "public" como estática
app.use(express.static(path.join(__dirname, 'public')));

// 2) Permitir recibir JSON en el body  
app.use(express.json());


// ─────────── Ruta de alta de jugador con hCaptcha ───────────
app.post('/api/alta-jugador', async (req, res) => {
  const { nombre, token } = req.body;

  if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
    return res.status(400).json({ error: 'Nombre inválido.' });
  }
  if (!token) {
    return res.status(400).json({ error: 'Captcha obligatorio.' });
  }

  try {
    // Verificar hCaptcha
    const captchaResponse = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.HCAPTCHA_SECRET,
        response: token
      })
    });
    const captcha = await captchaResponse.json();
    if (!captcha.success) {
      return res.status(403).json({ error: 'Captcha inválido.' });
    }
  } catch (err) {
    console.error('Error verificando hCaptcha:', err);
    return res.status(500).json({ error: 'Error al verificar el captcha.' });
  }

  try {
    // Comprueba si ya existe el jugador
    const { data: existe, error: errorSelect } = await supabase
      .from('jugadores')
      .select('id')
      .eq('nombre', nombre.trim())
      .maybeSingle();

    if (errorSelect) {
      console.error('Error al buscar jugador existente →', errorSelect.message);
      return res.status(500).json({ error: errorSelect.message });
    }
    if (existe) {
      return res.status(400).json({ error: 'El jugador ya existe.' });
    }

    // Inserta el nuevo jugador
    const { error } = await supabase
      .from('jugadores')
      .insert([{ nombre: nombre.trim() }]);
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Error al registrar jugador:', err);
    res.status(500).json({ error: 'Error inesperado en el servidor.' });
  }
});


// ─────────── Rutas de resultados / scraping / bots ───────────
app.use(tiemposMejorados);
app.use(adminRoutes);
app.use(rankingRoutes);
app.use(commitRankingRoutes);
app.use(telegramRoutes);
app.use(checkMejoras);

// ─────────── Aquí montamos el RANKING ANUAL ───────────
app.use(rankingAnualRouter);   // ← Se expone exactamente en GET  /api/enviar-ranking-anual

// ─────────── Configuración adicional (por ejemplo, credenciales Supabase) ───────────
app.use(configuracionRouter);

app.get('/api/supabase-credentials', (req, res) => {
  res.json({
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  });
});


// ─────────── Iniciar servidor ───────────
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
