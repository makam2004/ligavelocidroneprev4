// routes/rankingAnual.js
import express from 'express';
import supabase from '../supabaseClient.js'; // Ajusta la ruta si tu proyecto es diferente

const router = express.Router();

router.get('/api/enviar-ranking-anual', async (req, res) => {
  try {
    // 1) Consulta a Supabase para traer nombre y puntos_anuales, ordenados
    const { data, error } = await supabase
      .from('jugadores')
      .select('nombre, puntos_anuales')
      .order('puntos_anuales', { ascending: false });

    // 2) Si Supabase devolvió un error, detenemos y devolvemos el mensaje real
    if (error) {
      console.error('Error al consultar tabla "jugadores" →', error.message);
      return res
        .status(500)
        .json({ ok: false, error: error.message });
    }

    // 3) Verificamos que data no sea null (por seguridad, aunque suele venir siempre array)
    if (!data) {
      console.error('Error inesperado: "data" es null al consultar jugadores');
      return res
        .status(500)
        .json({ ok: false, error: 'No se obtuvieron datos de jugadores' });
    }

    // 4) Mapear el array a solo { nombre, puntos_anuales }
    const resultado = data.map(row => ({
      nombre: row.nombre,
      puntos_anuales: row.puntos_anuales
    }));

    // 5) Devolver { ok: true, data: [...] }
    return res.json({ ok: true, data: resultado });
  } catch (err) {
    // 6) Capturar cualquier excepción “inesperada” y devolver err.message
    console.error('Error inesperado en /api/enviar-ranking-anual →', err);
    return res
      .status(500)
      .json({ ok: false, error: err.message || 'Error interno al cargar ranking anual' });
  }
});

export default router;
