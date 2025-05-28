
import express from "express";
import supabase from "../supabaseClient.js";
import axios from "axios";
import { tiemposMejorados } from "./tiemposMejorados.js"; // debes exportar la función desde tiemposMejorados.js

const router = express.Router();

router.get("/api/check-mejoras", async (req, res) => {
  try {
    const datos = await tiemposMejorados();
    console.log("Datos recibidos de tiemposMejorados:", datos); // debe devolver [{ piloto, track, tiempo }]
    const mejorasDetectadas = [];
    console.log("Comprobando mejoras para:", datos);

    for (const registro of datos) {
      const { piloto, track, tiempo } = registro;

      const { data: existente, error: errorSelect } = await supabase
        .from("ultimos_tiempos")
        .select("*")
        .eq("piloto", piloto)
        .eq("track", track)
        .maybeSingle();

      if (errorSelect) continue;

      if (!existente) {
        await supabase.from("ultimos_tiempos").insert({ piloto, track, tiempo });
        continue;
      }

      if (tiempo < existente.tiempo) {
        mejorasDetectadas.push({
          piloto,
          track,
          tiempoAnterior: existente.tiempo,
          tiempoNuevo: tiempo
        });

        await supabase
          .from("ultimos_tiempos")
          .update({ tiempo, fecha: new Date().toISOString() })
          .eq("piloto", piloto)
          .eq("track", track);
      }
    }

    console.log("Mejoras detectadas:", mejorasDetectadas);
    for (const mejora of mejorasDetectadas) {
      const mensaje = `⏱️ Nueva mejora de tiempo en el *${mejora.track}*
` +
                      `👤 *Piloto*: ${mejora.piloto}
` +
                      `🔻 *Tiempo anterior*: ${mejora.tiempoAnterior.toFixed(2)} s
` +
                      `✅ *Nuevo tiempo*: ${mejora.tiempoNuevo.toFixed(2)} s
` +
                      `📅 ${new Date().toLocaleString("es-ES")}`;

      try {
        console.log("Enviando mensaje a Telegram:", mensaje);
        await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: mensaje,
          parse_mode: "Markdown"
        });
      } catch (e) {
        console.error("Error enviando mensaje a Telegram:", e.response?.data || e.message);
      }
    }

    res.json({
      status: "ok",
      mejoras: mejorasDetectadas.length,
      detalles: mejorasDetectadas
    });
  } catch (err) {
    console.error("Error en check-mejoras:", err);
    res.status(500).json({ error: "Error en la verificación de mejoras" });
  }
});

export default router;
