let supabaseClient = null;

async function cargarTipsPopup() {
  try {
    if (!supabaseClient) {
      const res = await fetch("/api/supabase-credentials");
      const creds = await res.json();
      supabaseClient = window.supabase.createClient(creds.url, creds.key);
    }

    const contenedor = document.querySelector("#popupTipsContenido");
    if (!contenedor) {
      console.error("❌ No se encontró el contenedor #popupTipsContenido");
      return;
    }

    contenedor.innerHTML = ""; // limpia contenido anterior
    console.log("✅ Contenedor encontrado, limpiado y listo para mostrar tips");

    const { data, error } = await supabaseClient
      .from("tips")
      .select("*")
      .order("fecha", { ascending: false });

    if (error || !data) {
      contenedor.innerHTML = "<p>Error al cargar los tips.</p>";
      console.error("❌ Error al cargar datos de Supabase:", error);
    } else {
      const bloquesHTML = data.map(tip => {
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
      });

      contenedor.innerHTML = bloquesHTML.join("");
      console.log(`✅ Se insertaron ${data.length} tips en #popupTipsContenido`);
    }

    // Mostrar popup y fondo
    const popup = document.querySelector("#popupTips");
    const overlay = document.getElementById("overlay");
    if (popup && overlay) {
      popup.style.display = "block";
      overlay.style.display = "block";
      console.log("✅ popupTips y overlay visibles");
    } else {
      console.error("❌ popupTips o overlay no encontrados");
    }

  } catch (err) {
    console.error("❌ Error general:", err);
    const contenedor = document.querySelector("#popupTipsContenido");
    if (contenedor) contenedor.innerHTML = "<p>Error inesperado al cargar los tips.</p>";
  }
}