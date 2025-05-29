import express from 'express';
import supabase from '../supabaseClient.js';

const router = express.Router();

router.get('/api/ranking-anual', async (_req, res) => {
  try {
    // Fallback manual (sin JOIN Supabase)
    const { data: jugadores } = await supabase.from('jugadores').select('id, nombre');
    const { data: ranking } = await supabase.from('ranking_anual').select('jugador_id, puntos');

    const nombres = Object.fromEntries(jugadores.map(j => [j.id, j.nombre]));

    const resultado = ranking.map(r => ({
      nombre: nombres[r.jugador_id] || 'Desconocido',
      puntos: r.puntos
    }));

    res.json(resultado.sort((a, b) => b.puntos - a.puntos));
  } catch (err) {
    console.error('Error al obtener ranking anual:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

export default router;
