// Las fotos del celular suelen pesar 3 a 10 MB. Antes de subirlas las achicamos a 1600 px
// del lado más largo y las pasamos a JPEG: quedan en unos 300-600 KB, suben rápido y se ven bien.
const MAX_SIDE = 1600;

export async function prepareImage(file) {
  if (!file || !file.type?.startsWith('image/')) return file;
  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    URL.revokeObjectURL(url);
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; // fondo blanco por si la foto es PNG con transparencia
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) return file;
    const name = (file.name || 'foto').replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg' });
  } catch {
    // Si el navegador no puede abrir el formato (por ejemplo HEIC en algunos Android), se manda tal cual
    return file;
  }
}

// Lee la respuesta del servidor aunque no sea JSON, con un mensaje entendible
export async function readUploadResponse(res) {
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!res.ok) {
    const message =
      data.message ||
      (res.status === 413
        ? 'La foto es demasiado pesada. Probá con otra o sacala de nuevo.'
        : `No se pudo subir la foto (error ${res.status}). Probá de nuevo.`);
    throw new Error(message);
  }
  return data;
}
