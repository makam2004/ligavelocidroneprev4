let supabaseClient = null;

async function cargarTipsPopup() {
  try {
    if (!supabaseClient) {
      const res = await fetch("/api/supabase-credentials");
      const creds = await res.json();
      supabaseClient = window.supabase.createClient(creds.url, creds.key);
    }

    const contenedor = document.getElementById("popupTipsContenido");
    if (!contenedor) {
      console.error("❌ No se encuentra el contenedor popupTipsContenido");
      return;
    }

    contenedor.innerHTML = ""; // limpiar antes de insertar

    const { data, error } = await supabaseClient
      .from("tips")
      .select("*")
      .order("fecha", { ascending: false });

    if (error || !data) {
      contenedor.innerHTML = "<p>Error al cargar los tips.</p>";
      console.error("Error Supabase:", error);
    } else {
      data.forEach(tip => {
        const fecha = new Date(tip.fecha).toLocaleDateString("es-ES");
        const preview = tip.tipo === "youtube"
          ? `<img src="https://img.youtube.com/vi/${new URL(tip.url.replace('shorts/', 'watch?v=')).searchParams.get('v')}/hqdefault.jpg" style="width:180px; border-radius:6px;" />`
          : `<a href="${tip.url}" target="_blank">${tip.url}</a>`;

        const bloque = document.createElement("div");
        bloque.style = "margin-bottom: 20px; display: flex; gap: 10px; align-items: center;";
        bloque.innerHTML = `
          ${preview}
          <div>
            <div style="font-weight: bold;">${tip.titulo}</div>
            <div style="font-size: 0.85em; color: #666;">Publicado: ${fecha}</div>
            <a href="${tip.url}" target="_blank">Ver video</a>
          </div>
        `;
        contenedor.appendChild(bloque);
      });
    }

    document.getElementById("popupTips").style.display = "block";
    document.getElementById("overlay").style.display = "block";

  } catch (e) {
    console.error("❌ Error general al cargar tips:", e);
    const contenedor = document.getElementById("popupTipsContenido");
    if (contenedor) contenedor.innerHTML = "<p>Error inesperado al mostrar los tips.</p>";
    document.getElementById("popupTips").style.display = "block";
    document.getElementById("overlay").style.display = "block";
  }
}