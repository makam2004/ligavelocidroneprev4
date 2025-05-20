async function cargarTipsPopup() {
  const res = await fetch("/api/supabase-credentials");
  const creds = await res.json();
  const supabase = window.supabase.createClient(creds.url, creds.key);

  const { data, error } = await supabase
    .from("tips")
    .select("*")
    .order("fecha", { ascending: false });

  const contenedor = document.getElementById("popupTipsContenido");
  if (error || !data) {
    contenedor.innerHTML = "<p>Error al cargar los tips.</p>";
    return;
  }

  contenedor.innerHTML = data.map(tip => {
    let preview = "";
    if (tip.tipo === "youtube") {
      const videoId = new URL(tip.url.replace("shorts/", "watch?v=")).searchParams.get("v");
      preview = `<a href="https://www.youtube.com/watch?v=${videoId}" target="_blank">
                   <img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="${tip.titulo}" style="width:100%; border-radius:8px;" />
                 </a>`;
    } else if (tip.tipo === "instagram") {
      preview = `<a href="${tip.url}" target="_blank">${tip.url}</a>`;
    }

    return `<div style="margin-bottom: 20px;">
              ${preview}
              <div style="margin-top: 5px; font-weight: bold;">${tip.titulo}</div>
            </div>`;
  }).join("");

  document.getElementById("popupTips").style.display = "block";
}