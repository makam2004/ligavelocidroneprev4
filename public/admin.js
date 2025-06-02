// public/admin.js

// 1) Referencias al DOM
const formTracks   = document.getElementById('formTracks');
const mensajeTracks = document.getElementById('mensaje');
const mensajeCommit = document.getElementById('mensajeCommit');
const canvasTop3   = document.getElementById('canvasTop3');
const ctxTop3      = canvasTop3.getContext('2d');

// 2) Función auxiliar para calcular la semana actual
function calcularSemanaActual() {
  const fecha = new Date();
  const inicio = new Date(fecha.getFullYear(), 0, 1);
  const dias = Math.floor((fecha - inicio) / 86400000);
  return Math.ceil((dias + inicio.getDay() + 1) / 7);
}

// 3) Obtener Top 3 de cada pista (Track 1 y Track 2) desde /api/tiempos-mejorados
async function obtenerTop3Pilotos() {
  const res = await fetch('/api/tiempos-mejorados');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Datos inválidos de tiempos');

  // data[0] → resultados de Track 1, data[1] → resultados de Track 2
  const top3Track1 = [];
  const top3Track2 = [];

  if (Array.isArray(data[0]?.resultados)) {
    const ord1 = data[0].resultados.slice().sort((a,b) => a.tiempo - b.tiempo);
    ord1.slice(0,3).forEach(r => top3Track1.push(r.jugador));
  }

  if (Array.isArray(data[1]?.resultados)) {
    const ord2 = data[1].resultados.slice().sort((a,b) => a.tiempo - b.tiempo);
    ord2.slice(0,3).forEach(r => top3Track2.push(r.jugador));
  }

  return { top3Track1, top3Track2 };
}

// 4) Tomando una URL de imagen fija y un array con 3 nombres, genera un Blob JPEG
//    La imagen de fondo se carga desde /images/…, se sobrepone el texto (nombres) y se convierte a Blob
async function generarImagenConTop3(imagenURL, top3List) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imagenURL;
    img.crossOrigin = 'anonymous'; // necesario si la imagen está en otro dominio o para Canvas

    img.onload = () => {
      // Ajustar tamaño del canvas a la imagen
      canvasTop3.width = img.width;
      canvasTop3.height = img.height;

      // 4.1) Dibujar fondo
      ctxTop3.clearRect(0, 0, canvasTop3.width, canvasTop3.height);
      ctxTop3.drawImage(img, 0, 0, img.width, img.height);

      // 4.2) Configurar texto: tamaño relativo a la altura de la imagen
      const fontSize = Math.floor(img.height * 0.05);
      ctxTop3.font = `${fontSize}px sans-serif`;
      ctxTop3.fillStyle = 'white';
      ctxTop3.strokeStyle = 'black';
      ctxTop3.lineWidth = 2;
      ctxTop3.textAlign = 'center';

      // 4.3) Dibujar nombres centrados, comenzando en 15% de la altura
      const baseY = img.height * 0.15;
      top3List.forEach((jugador, idx) => {
        const texto = `${idx + 1}. ${jugador}`;
        const x = img.width / 2;
        const y = baseY + idx * (img.height * 0.06);

        // Trazar y rellenar para legibilidad
        ctxTop3.strokeText(texto, x, y);
        ctxTop3.fillText(texto, x, y);
      });

      // 4.4) Convertir el canvas a Blob (JPEG calidad 0.8)
      canvasTop3.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Error convirtiendo canvas a Blob'));
      }, 'image/jpeg', 0.8);
    };

    img.onerror = (err) => reject(err);
  });
}

// 5) Manejador al hacer “Actualizar Tracks”
formTracks.onsubmit = async (e) => {
  e.preventDefault();
  mensajeTracks.style.color = 'white';
  mensajeTracks.textContent = '🔄 Actualizando tracks…';

  const datosTracks = Object.fromEntries(new FormData(e.target));
  try {
    // 5.1) Enviar configuración al servidor
    const res = await fetch('/admin/update-tracks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosTracks)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    mensajeTracks.textContent = json.mensaje || '✅ Tracks actualizados correctamente.';

    // 5.2) Enviar ranking semanal en texto a Telegram
    mensajeTracks.textContent = '🔄 Enviando ranking semanal a Telegram…';
    const respRanking = await fetch('/api/enviar-ranking-telegram');
    const dataRanking = await respRanking.json();
    if (!dataRanking.ok) throw new Error(dataRanking.error || 'Error al enviar ranking.');

    // 5.3) Obtener Top 3 de cada pista
    mensajeTracks.textContent = '🔄 Calculando Top 3 de cada pista…';
    const { top3Track1, top3Track2 } = await obtenerTop3Pilotos();

    // 5.4) Generar y enviar imágenes para Track 1 y Track 2
    const hiloTelegram = 4; // siempre enviamos ambas fotos al hilo 4

    // – Track 1
    mensajeTracks.textContent = '🔄 Generando imagen Track 1 con Top 3…';
    const blob1 = await generarImagenConTop3('/images/Track1.jpg', top3Track1);
    const fd1 = new FormData();
    fd1.append('imagen', blob1, 'podium_track1.jpg');
    fd1.append('thread_id', hiloTelegram);
    const respFoto1 = await fetch('/admin/send-foto-top3', {
      method: 'POST',
      body: fd1
    });
    const jsonFoto1 = await respFoto1.json();
    if (!jsonFoto1.ok) throw new Error(jsonFoto1.error || 'Error enviando foto Track 1');

    // – Track 2
    mensajeTracks.textContent = '🔄 Generando imagen Track 2 con Top 3…';
    const blob2 = await generarImagenConTop3('/images/Track2.jpg', top3Track2);
    const fd2 = new FormData();
    fd2.append('imagen', blob2, 'podium_track2.jpg');
    fd2.append('thread_id', hiloTelegram);
    const respFoto2 = await fetch('/admin/send-foto-top3', {
      method: 'POST',
      body: fd2
    });
    const jsonFoto2 = await respFoto2.json();
    if (!jsonFoto2.ok) throw new Error(jsonFoto2.error || 'Error enviando foto Track 2');

    // 5.5) Mensaje final de éxito
    mensajeTracks.style.color = 'lightgreen';
    mensajeTracks.textContent = '✅ Ranking y ambas fotos Top 3 enviados con éxito.';
  } catch (err) {
    console.error(err);
    mensajeTracks.style.color = 'red';
    mensajeTracks.textContent = `❌ ${err.message}`;
  }
};

// 6) Función de “Hacer Commit al Ranking Semanal” (se mantiene exactamente igual)
async function commitRanking() {
  if (!confirm('¿Estás seguro de que quieres hacer commit del ranking semanal al anual?')) return;
  try {
    const response = await fetch('/api/commit-ranking', { method: 'POST' });
    const result = await response.json();
    mensajeCommit.textContent = result.message || '✅ Commit realizado.';
  } catch {
    mensajeCommit.textContent = '❌ Error al hacer commit del ranking.';
  }
}
