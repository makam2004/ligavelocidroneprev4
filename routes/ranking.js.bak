import express from 'express';
import supabase from '../supabaseClient.js';

const router = express.Router();

router.get('/api/ranking-anual', async (_req, res) => {
  const { data, error } = await supabase
    .from('ranking_anual')
    .select('jugador_id, puntos, jugadores(nombre)')
    .order('puntos', { ascending: false });

  if (error) {
    console.error('Error al obtener ranking anual:', error);
    return res.status(500).json({ error: error.message });
  }

  const resultado = data.map(r => ({
    nombre: r.jugadores?.nombre || 'Desconocido',
    puntos: r.puntos
  }));

  res.json(resultado);
});

export default router;
