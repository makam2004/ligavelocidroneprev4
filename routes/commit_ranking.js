const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

router.post("/api/commit-ranking", async (req, res) => {
  try {
    // 1. Obtener todos los jugadores y sus puntos semanales
    const { data: jugadores, error } = await supabase
      .from("jugadores")
      .select("id, puntos_semanales, puntos_anuales");

    if (error) throw error;

    // 2. Iterar y actualizar cada jugador
    for (const jugador of jugadores) {
      const puntosSemana = jugador.puntos_semanales || 0;
      const puntosAnuales = jugador.puntos_anuales || 0;

      const nuevosPuntos = puntosAnuales + puntosSemana;

      const { error: updateError } = await supabase
        .from("jugadores")
        .update({
          puntos_anuales: nuevosPuntos,
          puntos_semanales: 0
        })
        .eq("id", jugador.id);

      if (updateError) throw updateError;
    }

    res.json({ success: true, message: "Commit realizado correctamente." });

  } catch (err) {
    console.error("Error en /api/commit-ranking:", err.message);
    res.status(500).json({ success: false, message: "Error al hacer commit." });
  }
});

module.exports = router;
