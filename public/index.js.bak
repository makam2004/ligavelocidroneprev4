import express from 'express';
import basicAuth from 'express-basic-auth';
import path from 'path';
import { fileURLToPath } from 'url';

import adminRoutes from './routes/admin.js';
import tiemposMejorados from './routes/tiemposMejorados.js';
import supabase from './supabaseClient.js';
import rankingRoutes from './routes/ranking.js';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());

import basicAuth from 'express-basic-auth';

const usuarios = {};
usuarios[process.env.ADMIN_USER] = process.env.ADMIN_PASS;

// Proteger admin.html
app.use('/admin.html', basicAuth({
  users: usuarios,
  challenge: true
}));


// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Protección de acceso a /admin
const adminAuth = basicAuth({
  users: { [process.env.ADMIN_USER]: process.env.ADMIN_PASS },
  challenge: true,
  unauthorizedResponse: 'Acceso no autorizado'
});

app.get('/admin', adminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API protegida para cambiar tracks y reiniciar ranking semanal
app.use(adminRoutes);

// Alta de jugador
app.post('/api/alta-jugador', async (req, res) => {
  const { nombre } = req.body;

  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ error: 'Nombre requerido.' });
  }

  // Comprobar si ya existe
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

// API pública de resultados
app.use(tiemposMejorados);
app.use(rankingRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
