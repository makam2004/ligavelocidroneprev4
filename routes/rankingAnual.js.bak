// routes/rankingAnual.js
import express from 'express';
import supabase from '../supabaseClient.js'; // Ajusta la ruta si es necesario

const router = express.Router();

router.get('/api/enviar-ranking-anual', async (req, res) => {
  try {
    // 1) Hacer la consulta a Supabase
    const { data, error } = await supabase
      .from('jugadores')
      .select('nombre, puntos_anuales')
      .order('puntos_anuales', { ascending: false });

    // 2) Si Supabase devolvió un error, lo devolvemos al cliente en JSON
    if (error) {
      console.error('Error al consultar jugadores →', error.message);
      return res
        .status(500)
        .json({ ok: false, error: error.message });
    }

    // 3) Comprobar que 'data' no sea null (por seguridad)
    if (!data) {
      console.error('Error inesperado: "data" es null en consulta a jugadores');
      return res
        .status(500)
        .json({ ok: false, error: 'No se obtuvieron datos de jugadores' });
    }

    // 4) Mapear el array de resultados al formato { nombre, puntos_anuales }
    const resultado = data.map(row => ({
      nombre: row.nombre,
      puntos_anuales: row.puntos_anuales
    }));

    // 5) Devolvemos { ok: true, data: [...] }
    return res.json({ ok: true, data: resultado });
  } catch (err) {
    // 6) Si ocurre cualquier excepción inusual, la enviamos al cliente también
    console.error('Error inesperado en /api/enviar-ranking-anual →', err);
    return res
      .status(500)
      .json({ ok: false, error: err.message || 'Error interno al cargar ranking anual' });
  }
});

export default router;
