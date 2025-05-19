import express from 'express';
import basicAuth from 'express-basic-auth';
import path from 'path';
import { fileURLToPath } from 'url';

import adminRoutes from './routes/admin.js';
import tiemposMejorados from './routes/tiemposMejorados.js';
import rankingRoutes from './routes/ranking.js';
import supabase from './supabaseClient.js';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());

// ✅ Definir credenciales de administrador desde variables de entorno
const usuarios = {};
usuarios[process.env.ADMIN_USER] = process.env.ADMIN_PASS;

// ✅ Protección explícita para admin.html (requiere login)
app.get('/admin.html', basicAuth({
  users: usuarios,
  challenge: true,
  unauthorizedResponse: 'Acceso no autorizado'
}), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ✅ Protección también para ruta /admin si es necesaria
app.get('/admin', basicAuth({
  users: usuarios,
  challenge: true,
  unauthorizedResponse: 'Acceso no autorizado'
}), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ✅ Servir contenido estático desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Rutas API protegidas para cambios desde la página admin
app.use(adminRoutes);

// ✅ Ruta pública para alta de jugadores
app.post('/api/alta-jugador', async (req, res) => {
  const { nombre } = req.body;

  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ error: 'Nombre requerido.' });
  }

  const { data: existe } = await supabase
    .from('jugadores')
    .select('id')
    .eq('nombre', nombre.trim())
    .maybeSingle();

  if (existe) {
    return res.status(400).json({ error: 'El jugador ya existe.' });
  }

  const { error } = await supabase
    .from('jugadores')
    .insert([{ nombre: nombre.trim() }]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ ok: true });
});

// ✅ Rutas de resultados
app.use(tiemposMejorados);
app.use(rankingRoutes);

// ✅ Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
