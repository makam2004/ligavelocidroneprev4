import express from 'express';
import supabase from '../supabaseClient.js'; // Ajusta la ruta si hace falta

const router = express.Router();

router.get('/api/configuracion', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('configuracion')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Error al obtener configuración:', err);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

export default router;
