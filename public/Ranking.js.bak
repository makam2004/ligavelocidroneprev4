async function cargarRankingAnual() {
  const supabase = await window.initSupabase();

  const { data, error } = await supabase
    .from("jugadores")
    .select("nombre, puntos_anuales")
    .order("puntos_anuales", { ascending: false });

  if (error) {
    console.error("Error cargando ranking anual:", error);
    return;
  }

  const tabla = document.getElementById("ranking-anual-body");
  if (!tabla) return;

  tabla.innerHTML = "";
  data.forEach(jugador => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${jugador.nombre}</td>
      <td>${jugador.puntos_anuales}</td>
    `;
    tabla.appendChild(fila);
  });
}

window.onload = cargarRankingAnual;