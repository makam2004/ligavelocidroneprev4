let supabaseClient = null;

async function cargarTipsPopup() {
  try {
    if (!supabaseClient) {
      const res = await fetch("/api/supabase-credentials");
      const creds = await res.json();
      supabaseClient = window.supabase.createClient(creds.url, creds.key);
    }

    const { data, error } = await supabaseClient
      .from("tips")
      .select("*")
      .order("fecha", { ascending: false });

    const contenedor = document.getElementById("popupTipsContenido");
    contenedor.innerHTML = ""; // 🧹 limpia antes de renderizar

    if (error || !data) {
      contenedor.innerHTML = "<p>Error al cargar los tips.</p>";
      console.error("Error cargando tips:", error);
    } else {
      contenedor.innerHTML = data.map(tip => {
        const fecha = new Date(tip.fecha).toLocaleDateString("es-ES");
        let preview = "";
        if (tip.tipo === "youtube") {
          const cleanUrl = tip.url.replace("shorts/", "watch?v=");
          const videoId = new URL(cleanUrl).searchParams.get("v");
          preview = `<img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="${tip.titulo}" style="width:180px; border-radius:6px;" />`;
        } else if (tip.tipo === "instagram") {
          preview = `<a href="${tip.url}" target="_blank">${tip.url}</a>`;
        }

        return `
          <div style="margin-bottom: 20px; display: flex; gap: 10px; align-items: center;">
            ${preview}
            <div>
              <div style="font-weight: bold;">${tip.titulo}</div>
              <div style="font-size: 0.85em; color: #666;">Publicado: ${fecha}</div>
              <a href="${tip.url}" target="_blank">Ver video</a>
            </div>
          </div>
        `;
      }).join("");
    }

    // Mostrar popup y fondo
    document.getElementById("popupTips").style.display = "block";
    document.getElementById("overlay").style.display = "block";

  } catch (err) {
    console.error("Error general al cargar Tips:", err);
    const contenedor = document.getElementById("popupTipsContenido");
    contenedor.innerHTML = "<p>Error inesperado al cargar los tips.</p>";
    document.getElementById("popupTips").style.display = "block";
    document.getElementById("overlay").style.display = "block";
  }
}