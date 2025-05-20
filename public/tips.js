async function cargarTips() {
  const credsRes = await fetch("/api/supabase-credentials");
  const creds = await credsRes.json();

  const supabase = window.supabase.createClient(creds.url, creds.key);

  const { data, error } = await supabase
    .from("tips")
    .select("*")
    .order("fecha", { ascending: false });

  const contenedor = document.getElementById("tipsContainer");
  if (error || !data) {
    contenedor.innerHTML = "<p>Error al cargar los tips.</p>";
    return;
  }

  contenedor.innerHTML = data.map(tip => {
    let preview = "";
    if (tip.tipo === "youtube") {
      const videoId = new URL(tip.url).searchParams.get("v");
      preview = `<a href="${tip.url}" target="_blank">
                   <img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="${tip.titulo}" />
                 </a>`;
    } else if (tip.tipo === "instagram") {
      preview = `<a href="${tip.url}" target="_blank">${tip.url}</a>`;
    }

    return `<div class="tip-card">
              ${preview}
              <div class="tip-title">${tip.titulo}</div>
            </div>`;
  }).join("");
}

window.onload = cargarTips;