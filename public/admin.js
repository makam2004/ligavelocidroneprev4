// public/admin.js

// 1) Referencias al DOM
const formTracks    = document.getElementById('formTracks');
const mensajeTracks = document.getElementById('mensaje');
const mensajeCommit = document.getElementById('mensajeCommit');
const canvasTop3    = document.getElementById('canvasTop3');
const ctxTop3       = canvasTop3.getContext('2d');

// Referencias para “Agregar Tip”
const btnAgregarTip       = document.getElementById('btnAgregarTip');
const popupAgregarTip     = document.getElementById('popupAgregarTip');
const overlayAgregarTip   = document.getElementById('overlayAgregarTip');
const formAgregarTip      = document.getElementById('formAgregarTip');
const tipTitleInput       = document.getElementById('tipTitle');
const tipUrlInput         = document.getElementById('tipUrl');
const tipTypeInput        = document.getElementById('tipType');
const mensajeAgregarTip   = document.getElementById('mensajeAgregarTip');

// 2) Supabase client para Tips
let supabaseClient = null;
async function ensureSupabase() {
  if (!supabaseClient) {
    const res = await fetch('/api/supabase-credentials');
    const creds = await res.json();
    supabaseClient = window.supabase.createClient(creds.url, creds.key);
  }
}

// 3) Función auxiliar para calcular la semana actual
function calcularSemanaActual() {
  const fecha = new Date();
  const inicio = new Date(fecha.getFullYear(), 0, 1);
  const dias = Math.floor((fecha - inicio) / 86400000);
  return Math.ceil((dias + inicio.getDay() + 1) / 7);
}

// 4) Obtener Top 3 de cada pista (Track 1 y Track 2) desde /api/tiempos-mejorados
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

// 5) Generar imagen con Top 3 (primer nombre centrado, segundo izquierda, tercero derecha)
async function generarImagenConTop3(imagenURL, top3List) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imagenURL;
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      canvasTop3.width = img.width;
      canvasTop3.height = img.height;

      ctxTop3.clearRect(0, 0, canvasTop3.width, canvasTop3.height);
      ctxTop3.drawImage(img, 0, 0, img.width, img.height);

      const fontSize = Math.floor(img.height * 0.04);
      ctxTop3.font = `${fontSize}px sans-serif`;
      ctxTop3.fillStyle = 'white';
      ctxTop3.strokeStyle = 'black';
      ctxTop3.lineWidth = 2;

      // Posiciones horizontales: 10%, 50%, 90%
      const xLeft = img.width * 0.1;
      const xCenter = img.width / 2;
      const xRight = img.width * 0.9;
      const y = img.height * 0.15;

      // Primero (centrado)
      ctxTop3.textAlign = 'center';
      ctxTop3.strokeText(`1. ${top3List[0]}`, xCenter, y);
      ctxTop3.fillText(`1. ${top3List[0]}`, xCenter, y);

      // Segundo (izquierda)
      ctxTop3.textAlign = 'left';
      ctxTop3.strokeText(`2. ${top3List[1]}`, xLeft, y);
      ctxTop3.fillText(`2. ${top3List[1]}`, xLeft, y);

      // Tercero (derecha)
      ctxTop3.textAlign = 'right';
      ctxTop3.strokeText(`3. ${top3List[2]}`, xRight, y);
      ctxTop3.fillText(`3. ${top3List[2]}`, xRight, y);

      canvasTop3.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Error convirtiendo canvas a Blob'));
      }, 'image/jpeg', 0.8);
    };

    img.onerror = err => reject(err);
  });
}

// 6) Manejador al hacer “Actualizar Tracks”
formTracks.onsubmit = async (e) => {
  e.preventDefault();
  mensajeTracks.style.color = 'white';
  mensajeTracks.textContent = '🔄 Actualizando tracks…';

  const datosTracks = Object.fromEntries(new FormData(e.target));
  try {
    // 6.1) Enviar configuración al servidor
    const res = await fetch('/admin/update-tracks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosTracks)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    mensajeTracks.textContent = json.mensaje || '✅ Tracks actualizados correctamente.';

    // 6.2) Enviar ranking semanal en texto a Telegram
    mensajeTracks.textContent = '🔄 Enviando ranking semanal a Telegram…';
    const respRanking = await fetch('/api/enviar-ranking-telegram');
    const dataRanking = await respRanking.json();
    if (!dataRanking.ok) throw new Error(dataRanking.error || 'Error al enviar ranking.');

    // 6.3) Obtener Top 3 de cada pista
    mensajeTracks.textContent = '🔄 Calculando Top 3 de cada pista…';
    const { top3Track1, top3Track2 } = await obtenerTop3Pilotos();

    // 6.4) Generar y enviar imágenes para Track 1 y Track 2
    const hiloTelegram = 4;

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

    // 6.5) Mensaje final de éxito
    mensajeTracks.style.color = 'lightgreen';
    mensajeTracks.textContent = '✅ Ranking y ambas fotos Top 3 enviados con éxito.';
  } catch (err) {
    console.error(err);
    mensajeTracks.style.color = 'red';
    mensajeTracks.textContent = `❌ ${err.message}`;
  }
};

// 7) Función de “Hacer Commit al Ranking Semanal” (sin cambios)
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

// ─────────────────────────────────────────────────────────────────
// Nuevas funciones para “Agregar Tip”
// ─────────────────────────────────────────────────────────────────

// 8) Mostrar y ocultar popup de “Agregar Tip”
btnAgregarTip.addEventListener('click', () => {
  mensajeAgregarTip.textContent = '';
  tipTitleInput.value = '';
  tipUrlInput.value = '';
  tipTypeInput.value = 'youtube';
  popupAgregarTip.style.display = 'block';
  overlayAgregarTip.style.display = 'block';
});
overlayAgregarTip.addEventListener('click', () => {
  popupAgregarTip.style.display = 'none';
  overlayAgregarTip.style.display = 'none';
});

// 9) Manejar envío del formulario de “Agregar Tip”
formAgregarTip.onsubmit = async (e) => {
  e.preventDefault();
  mensajeAgregarTip.style.color = 'white';
  mensajeAgregarTip.textContent = '🔄 Subiendo tip…';

  try {
    await ensureSupabase();

    // 9.1) Leer campos
    const titulo = tipTitleInput.value.trim();
    const url = tipUrlInput.value.trim();
    const tipo = tipTypeInput.value.trim() || 'youtube';
    if (!titulo || !url) throw new Error('Título y URL son obligatorios.');

    // 9.2) Generar ID aleatorio (UUID si está soportado)
    let id;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      id = crypto.randomUUID();
    } else {
      id = String(Date.now()) + Math.floor(Math.random() * 1000);
    }
    // 9.3) Fecha actual en ISO
    const fecha = new Date().toISOString();

    // 9.4) Insertar en Supabase
    const { data, error } = await supabaseClient
      .from('tips')
      .insert([{ id, titulo, url, tipo, fecha }]);

    if (error) throw error;

    mensajeAgregarTip.style.color = 'lightgreen';
    mensajeAgregarTip.textContent = '✅ Tip agregado correctamente.';

    // 9.5) Opcional: recargar lista de tips en popup (si ya está abierto)
    if (window.cargarTipsPopup) {
      await window.cargarTipsPopup();
    }

    // 9.6) Cerrar popup tras un breve retraso
    setTimeout(() => {
      popupAgregarTip.style.display = 'none';
      overlayAgregarTip.style.display = 'none';
    }, 1000);
  } catch (err) {
    console.error('Error agregando tip:', err);
    mensajeAgregarTip.style.color = 'red';
    mensajeAgregarTip.textContent = `❌ ${err.message}`;
  }
};


// 9) Manejar envío del formulario de “Agregar Tip”
formAgregarTip.onsubmit = async (e) => {
  e.preventDefault();
  mensajeAgregarTip.style.color = 'white';
  mensajeAgregarTip.textContent = '🔄 Subiendo tip…';

  try {
    await ensureSupabase();

    // 9.1) Leer campos
    const titulo = tipTitleInput.value.trim();
    const url    = tipUrlInput.value.trim();
    const tipo   = tipTypeInput.value.trim() || 'youtube';
    if (!titulo || !url) throw new Error('Título y URL son obligatorios.');

    // 9.2) Generar ID aleatorio
    let id;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      id = crypto.randomUUID();
    } else {
      id = String(Date.now()) + Math.floor(Math.random() * 1000);
    }
    // 9.3) Fecha actual en ISO
    const fecha = new Date().toISOString();

    // 9.4) Insertar en Supabase
    const { data, error } = await supabaseClient
      .from('tips')
      .insert([{ id, titulo, url, tipo, fecha }]);

    if (error) throw error;

    // 9.5) Enviar notificación a Telegram
    mensajeAgregarTip.textContent = '🔄 Enviando notificación a Telegram…';
    const respTelegram = await fetch('/api/send-tip-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, url, tipo, fecha })
    });
    const jsonTelegram = await respTelegram.json();
    if (!jsonTelegram.ok) throw new Error(jsonTelegram.error || 'Error al enviar a Telegram');

    // 9.6) Mostrar éxito y cerrar popup
    mensajeAgregarTip.style.color = 'lightgreen';
    mensajeAgregarTip.textContent = '✅ Tip agregado y notificado a Telegram.';

    if (window.cargarTipsPopup) {
      await window.cargarTipsPopup();
    }
    setTimeout(() => {
      popupAgregarTip.style.display = 'none';
      overlayAgregarTip.style.display = 'none';
    }, 1000);

  } catch (err) {
    console.error('Error agregando tip:', err);
    mensajeAgregarTip.style.color = 'red';
    mensajeAgregarTip.textContent = `❌ ${err.message}`;
  }
};
