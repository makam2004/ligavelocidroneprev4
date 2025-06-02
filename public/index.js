// index.js
import express from 'express';
import basicAuth from 'express-basic-auth';
import path from 'path';
import { fileURLToPath } from 'url';

import adminRoutes from './routes/admin.js';
import tiemposMejorados from './routes/tiemposMejorados.js';
import rankingRoutes from './routes/ranking.js';
import rankingAnualRoutes from './routes/rankingAnual.js';
import supabase from '../supabaseClient.js';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware para parsear JSON en el body
app.use(express.json());

// --- Protección básica para /admin.html y /admin ---
const usuarios = {};
usuarios[process.env.ADMIN_USER] = process.env.ADMIN_PASS;

// Protege el acceso a /admin.html
app.get('/admin.html', basicAuth({
  users: usuarios,
  challenge: true,
  unauthorizedResponse: 'Acceso no autorizado'
}), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Protege el acceso a /admin (alias)
app.get('/admin', basicAuth({
  users: usuarios,
  challenge: true,
  unauthorizedResponse: 'Acceso no autorizado'
}), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// --- Servir archivos estáticos de /public ---
app.use(express.static(path.join(__dirname, 'public')));

// --- Rutas API protegidas para administración ---
app.use(adminRoutes);

// --- Endpoint público para dar de alta jugadores ---
app.post('/api/alta-jugador', async (req, res) => {
  const { nombre } = req.body;
  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ error: 'Nombre requerido.' });
  }

  // Comprueba si ya existe
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
  const { error: errorInsert } = await supabase
    .from('jugadores')
    .insert([{ nombre: nombre.trim() }]);

  if (errorInsert) {
    console.error('Error al insertar jugador →', errorInsert.message);
    return res.status(500).json({ error: errorInsert.message });
  }

  return res.json({ ok: true });
});

// --- Rutas de resultados / ranking / ranking anual ---
app.use(tiemposMejorados);
app.use(rankingRoutes);
app.use(rankingAnualRoutes);

// --- Iniciar servidor ---
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
