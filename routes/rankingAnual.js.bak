// rutas/rankingAnual.js
import express from 'express';
import supabase from '../supabaseClient.js'; // Ajusta la ruta si tu proyecto tiene otra estructura

const router = express.Router();

router.get('/api/enviar-ranking-anual', async (req, res) => {
  try {
    // 1) Hacer la consulta a Supabase para traer "nombre" y "puntos_anuales"
    const { data, error } = await supabase
      .from('jugadores')
      .select('nombre, puntos_anuales')
      .order('puntos_anuales', { ascending: false });

    // 2) Si Supabase devolvió un error, lo registramos en consola y devolvemos 500
    if (error) {
      console.error('Error al consultar jugadores →', error.message);
      return res
        .status(500)
        .json({ ok: false, error: error.message });
    }

    // 3) Por seguridad, comprobamos que "data" no sea null
    if (!data) {
      console.error('Error inesperado: "data" es null en consulta a jugadores');
      return res
        .status(500)
        .json({ ok: false, error: 'No se obtuvieron datos de jugadores' });
    }

    // 4) Transformamos cada fila en el formato que espera el front-end
    //    (en este caso, { nombre, puntos_anuales })
    const resultado = data.map(row => ({
      nombre: row.nombre,
      puntos_anuales: row.puntos_anuales
    }));

    // 5) Devolvemos el JSON con ok=true y el array de resultados
    return res.json({ ok: true, data: resultado });
  } catch (err) {
    // 6) Si ocurre cualquier excepción "inesperada", la registramos y devolvemos 500
    console.error('Error inesperado en /api/enviar-ranking-anual →', err);
    return res
      .status(500)
      .json({ ok: false, error: 'Error interno al cargar ranking anual' });
  }
});

export default router;
