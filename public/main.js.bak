document.addEventListener('DOMContentLoaded', async () => {
  const semana = obtenerSemanaActual();
  const titulo = document.getElementById("tituloSemana");
  if (titulo) titulo.textContent = `LIGA VELOCIDRONE - Semana ${semana}`;

  cargarMejoras();
  cargarRankingAnual();

  const btnReglamento = document.getElementById('btnReglamento');
  const btnAlta = document.getElementById('btnAlta');
  const overlay = document.getElementById('overlay');

  if (btnReglamento) btnReglamento.onclick = mostrarReglamento;
  if (btnAlta) btnAlta.onclick = mostrarAlta;
  if (overlay) overlay.onclick = cerrarPopups;
});

function obtenerSemanaActual() {
  const fecha = new Date();
  const inicio = new Date(fecha.getFullYear(), 0, 1);
  const dias = Math.floor((fecha - inicio) / 86400000);
  return Math.ceil((dias + inicio.getDay() + 1) / 7);
}

async function mostrarReglamento() {
  const res = await fetch('reglamento.txt');
  const texto = await res.text();
  const popupTexto = document.getElementById('popupTexto');
  const popup = document.getElementById('popup');
  const overlay = document.getElementById('overlay');

  if (popupTexto) popupTexto.innerHTML = `<pre>${texto}</pre>`;
  if (popup) popup.style.display = 'block';
  if (overlay) overlay.style.display = 'block';
}

function mostrarAlta() {
  const popupAlta = document.getElementById('popupAlta');
  const overlay = document.getElementById('overlay');
  if (popupAlta) popupAlta.style.display = 'block';
  if (overlay) overlay.style.display = 'block';
  if (window.hcaptcha) hcaptcha.reset();
}

function cerrarPopups() {
  const popup = document.getElementById('popup');
  const popupAlta = document.getElementById('popupAlta');
  const overlay = document.getElementById('overlay');
  const mensajeAlta = document.getElementById('mensajeAlta');
  const nombreJugador = document.getElementById('nombreJugador');

  if (popup) popup.style.display = 'none';
  if (popupAlta) popupAlta.style.display = 'none';
  if (overlay) overlay.style.display = 'none';
  if (mensajeAlta) mensajeAlta.textContent = '';
  if (nombreJugador) nombreJugador.value = '';
  if (window.hcaptcha) hcaptcha.reset();
}

async function registrarJugador(event) {
  event.preventDefault();
  const nombre = document.getElementById('nombreJugador')?.value.trim();
  const token = document.querySelector('[name="h-captcha-response"]')?.value;
  const mensaje = document.getElementById('mensajeAlta');

  if (!nombre || !token) {
    if (mensaje) mensaje.textContent = 'Por favor, completa el captcha y el nombre.';
    return;
  }

  try {
    const res = await fetch('/api/alta-jugador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, token })
    });

    const json = await res.json();
    if (res.ok) {
      if (mensaje) mensaje.textContent = 'Jugador registrado correctamente.';
      if (window.hcaptcha) hcaptcha.reset();
    } else {
      if (mensaje) mensaje.textContent = json?.error || 'Error al registrar.';
    }
  } catch (err) {
    if (mensaje) mensaje.textContent = 'Error al conectar con el servidor.';
  }
}

async function cargarMejoras() {
  const contenedor = document.getElementById('mejoras');
  if (!contenedor) return;
  contenedor.innerHTML = '<p>⏳ Leyendo resultados...</p>';

  try {
    const res = await fetch('/api/tiempos-mejorados');
    const data = await res.json();
    contenedor.innerHTML = '';

    const ranking = {};
    const puntos = [10, 9, 8, 7, 6, 5, 4, 3, 2];

    data.forEach((pista, idx) => {
      const card = document.createElement('div');
      card.classList.add('card');

      const titulo = document.createElement('h3');
      titulo.innerHTML = `<span style="color:red">${pista.pestaña}</span><br>${pista.escenario} - ${pista.pista}`;
      card.appendChild(titulo);

      const tabla = document.createElement('table');
      tabla.innerHTML = `
        <thead><tr><th>Ranking</th><th>Piloto</th><th>Tiempo</th></tr></thead>
        <tbody>
          ${pista.resultados.map((r, i) => {
            const puntosObtenidos = i < puntos.length ? puntos[i] : 1;
            ranking[r.jugador] = (ranking[r.jugador] || 0) + puntosObtenidos;
            return `<tr><td>${i + 1}</td><td>${r.jugador}</td><td>${r.tiempo.toFixed(2)} s</td></tr>`;
          }).join('')}
        </tbody>
      `;
      card.appendChild(tabla);
      contenedor.appendChild(card);
    });

    const entries = Object.entries(ranking).sort((a, b) => b[1] - a[1]);
    const tablaSemanal = document.querySelector('#rankingSemanal .resultado');
    if (tablaSemanal) {
      tablaSemanal.innerHTML =
        `<table><thead><tr><th>#</th><th>Piloto</th><th>Puntos</th></tr></thead><tbody>` +
        entries.map(([jugador, puntos], i) => `<tr><td>${i + 1}</td><td>${jugador}</td><td>${puntos}</td></tr>`).join('') +
        `</tbody></table>`;
    }
  } catch (err) {
    console.error('❌ Error capturado en cargarMejoras:', err);
    contenedor.innerHTML = '<p>Error al cargar los resultados.</p>';
  }
}

async function cargarRankingAnual() {
  try {
    const res = await fetch('/api/ranking-anual');
    const data = await res.json();

    const html = data.map((r, i) =>
      `<tr><td>${i + 1}</td><td>${r.nombre}</td><td>${r.puntos}</td></tr>`
    ).join('');

    const tabla = document.querySelector('#rankingAnual .resultado');
    if (tabla) {
      tabla.innerHTML =
        `<table><thead><tr><th>#</th><th>Piloto</th><th>Puntos</th></tr></thead><tbody>${html}</tbody></table>`;
    }
  } catch (err) {
    console.error('Error al cargar ranking anual:', err);
    const tabla = document.querySelector('#rankingAnual .resultado');
    if (tabla) tabla.innerHTML = '<p>Error</p>';
  }
}
