// rutas/rankingAnual.js
import express from 'express';
import supabase from '../supabaseClient.js'; // Ajusta la ruta si es necesario

const router = express.Router();

router.get('/api/enviar-ranking-anual', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('jugadores')
      .select('nombre, puntos_anuales')
      .order('puntos_anuales', { ascending: false });

    if (error) throw error;

    res.json({
      ok: true,
      data
    });
  } catch (err) {
    console.error('Error al obtener ranking anual:', err);
    res.status(500).json({ ok: false, error: 'Error al obtener ranking anual' });
  }
});

export default router;
