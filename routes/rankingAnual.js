// routes/rankingAnual.js
import express from 'express';
import supabase from '../supabaseClient.js'; // Asegúrate de que la ruta sea correcta

const router = express.Router();

router.get('/api/enviar-ranking-anual', async (req, res) => {
  try {
    // 1) Ejecutamos la consulta a Supabase para obtener nombre y puntos_anuales
    const { data, error } = await supabase
      .from('jugadores')
      .select('nombre, puntos_anuales')
      .order('puntos_anuales', { ascending: false });

    // 2) Si Supabase devuelve un error, lo registramos y respondemos 500
    if (error) {
      console.error('Error al consultar jugadores →', error.message);
      return res.status(500).json({ ok: false, error: error.message });
    }

    // 3) data es un array (posiblemente vacío) de objetos { nombre, puntos_anuales }
    //    Aquí nos aseguramos de transformarlo explícitamente si quisiéramos refinar campos,
    //    pero en este caso _data_ ya viene en el formato correcto.
    const resultado = data.map(row => ({
      nombre: row.nombre,
      puntos_anuales: row.puntos_anuales
    }));

    // 4) Devolver al cliente un JSON con ok=true y data (array) listo para pintar
    return res.json({ ok: true, data: resultado });
  } catch (err) {
    // 5) Cualquier excepción “inesperada” (por ejemplo, supabaseClient no inicializado, problemas de conexión, etc.)
    console.error('Error inesperado en /api/enviar-ranking-anual →', err);
    return res.status(500).json({
      ok: false,
      error: 'Error interno al cargar ranking anual'
    });
  }
});

export default router;
