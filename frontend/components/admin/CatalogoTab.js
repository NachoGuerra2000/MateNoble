'use client';
import { useState, useEffect, useMemo, Fragment } from 'react';
import Image from 'next/image';
import { FileDown, Share2, Loader2, Check, AlertCircle } from 'lucide-react';
import { productsAPI } from '@/lib/api';
import { CATEGORY_ORDER, CATEGORY_HEADING } from '@/lib/categories';
import toast from 'react-hot-toast';

const CONFIG_KEY = 'catalogo-empresas-config';
const DEFAULT_CONFIG = {
  title: 'Mates para empresas',
  message:
    'Regalá tradición. Mates artesanales para tu equipo, tus clientes o tu evento de fin de año. Personalizamos con el logo de tu empresa o el escudo de tu club.',
  conditions:
    'Pedido mínimo: 10 unidades · Seña del 50% para confirmar y saldo contra entrega · Entregas en Tucumán',
  contact: 'WhatsApp: 381 212-9848 · Instagram: @matenoble.tuc',
  engravingPrice: '5000',
};
// Condiciones viejas que pudieron quedar guardadas (ahora el grabado tiene su propio precio)
const OLD_CONDITIONS = 'Pedido mínimo: 10 unidades · Seña del 50% para confirmar y saldo contra entrega · Entregas en Tucumán · Consultá por grabado personalizado';
// Texto de contacto viejo (sin número) que pudo quedar guardado en el navegador
const OLD_CONTACT = 'Instagram: @matenoble.tuc · WhatsApp: ';

// Link de WhatsApp a partir del primer número de Tucumán que aparezca en el contacto (381 xxx-xxxx)
const whatsappLink = (contact) => {
  const digits = (contact || '').match(/381[\s-]?\d{3}[\s-]?\d{4}/)?.[0].replace(/\D/g, '');
  return digits ? `https://wa.me/549${digits}` : null;
};

const GREEN = [71, 77, 51]; // verde oliva del logo
const DARK = [30, 41, 35];
const GRAY = [110, 120, 112];
const money = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-AR')}`;

// Imagen más liviana si viene de Cloudinary (el PDF queda chico para mandar por WhatsApp)
const lightUrl = (url) =>
  url?.includes('res.cloudinary.com') && url.includes('/upload/')
    ? url.replace('/upload/', '/upload/w_700,h_700,c_limit,q_auto,f_jpg/')
    : url;

const loadImage = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('img');
  const blob = await res.blob();
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
  const size = await new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
  });
  // jsPDF necesita JPEG o PNG: si es otro formato (webp), lo convertimos con un canvas
  if (!/^data:image\/(jpeg|png)/.test(dataUrl)) {
    const img = new window.Image();
    img.src = dataUrl;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = size.w;
    canvas.height = size.h;
    canvas.getContext('2d').drawImage(img, 0, 0);
    return { dataUrl: canvas.toDataURL('image/jpeg', 0.85), ...size, format: 'JPEG' };
  }
  return { dataUrl, ...size, format: dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG' };
};

// Precio que va en el catálogo: el de empresas si está cargado; si no, el de la tienda
const catalogPrice = (p) => (p.wholesalePrice > 0 ? p.wholesalePrice : p.price);

// PDF: una portada con el mensaje, el grabado y las condiciones, y después cada tipo de producto
// en sus propias páginas ("Mates de calabaza", "Combos"...), de a 4 productos por página.
const buildPdf = async (products, config) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const H = 297;
  const M = 14;
  const date = new Date().toLocaleDateString('es-AR');
  const engraving = Number(config.engravingPrice) || 0;
  const gap0 = 8;

  const logo = await loadImage('/logo.jpg').catch(() => null);
  const images = await Promise.all(products.map((p) => loadImage(lightUrl(p.image)).catch(() => null)));

  // Agrupar por tipo, respetando el orden de las categorías
  const groups = [];
  products.forEach((p, i) => {
    const last = groups[groups.length - 1];
    if (last && last.category === p.category) last.items.push({ p, img: images[i] });
    else groups.push({ category: p.category, items: [{ p, img: images[i] }] });
  });

  const text = (str, x, y, { size = 10, bold = false, color = DARK, align } = {}) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.text(str, x, y, align ? { align } : undefined);
  };

  // Franja de arriba de las páginas interiores
  const drawBand = () => {
    doc.setFillColor(...GREEN);
    doc.rect(0, 0, W, 18, 'F');
    if (logo) doc.addImage(logo.dataUrl, logo.format, M, 3, 12, 12);
    text(config.title || 'Catálogo', logo ? M + 16 : M, 11.5, { size: 13, bold: true, color: [255, 255, 255] });
    return 18;
  };

  const drawFooter = (page, total) => {
    doc.setDrawColor(218, 220, 198);
    doc.line(M, H - 16, W - M, H - 16);
    text(config.contact || '', M, H - 9, { size: 9, bold: true, color: GREEN });
    const wa = whatsappLink(config.contact);
    if (wa) doc.link(M, H - 13, doc.getTextWidth(config.contact || ''), 6, { url: wa });
    text(`Precios por unidad, válidos al ${date} · Página ${page} de ${total}`, W - M, H - 9, { size: 8, color: GRAY, align: 'right' });
  };

  // ---------- Portada ----------
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, W, 92, 'F');
  if (logo) doc.addImage(logo.dataUrl, logo.format, M, 14, 64, 64);
  const tx = logo ? M + 72 : M;
  const titleLines = doc.splitTextToSize(config.title || 'Catálogo', W - tx - M);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text(titleLines, tx, 42);
  text('Mate Noble · Tucumán', tx, 42 + titleLines.length * 11, { size: 12, color: [220, 222, 200] });

  let y = 108;
  if (config.message) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(config.message, W - 2 * M);
    doc.text(lines, M, y);
    y += lines.length * 6 + 8;
  }

  if (engraving > 0) {
    doc.setFillColor(248, 248, 241);
    doc.setDrawColor(...GREEN);
    doc.roundedRect(M, y, W - 2 * M, 24, 3, 3, 'FD');
    text(`Grabado personalizado: +${money(engraving)} por unidad`, M + 6, y + 10, { size: 13, bold: true, color: GREEN });
    text('Con el logo de tu empresa, el escudo de tu club o el nombre que quieras.', M + 6, y + 17.5, { size: 10, color: DARK });
    y += 34;
  }

  const conditions = (config.conditions || '').split('·').map((c) => c.trim()).filter(Boolean);
  if (conditions.length) {
    text('Condiciones', M, y, { size: 13, bold: true, color: GREEN });
    y += 7;
    conditions.forEach((c) => {
      const lines = doc.splitTextToSize(c, W - 2 * M - 6);
      doc.setFillColor(...GREEN);
      doc.circle(M + 1.5, y - 1.3, 0.9, 'F');
      text(lines, M + 6, y, { size: 10.5 });
      y += lines.length * 5.2 + 1.5;
    });
    y += 6;
  }

  text('En este catálogo', M, y, { size: 13, bold: true, color: GREEN });
  y += 7;
  groups.forEach((g) => {
    text(`${CATEGORY_HEADING[g.category] || g.category} (${g.items.length})`, M + 6, y, { size: 10.5 });
    y += 5.6;
  });

  // Cómo pedir, en tres pasos
  y += 8;
  if (y < H - 45) {
    text('Cómo hacer tu pedido', M, y, { size: 13, bold: true, color: GREEN });
    y += 6;
    const stepW = (W - 2 * M - 2 * gap0) / 3;
    [
      ['1. Cotizás', 'Nos decís qué mates, cuántos y para cuándo.'],
      ['2. Señás', 'Con el 50% confirmás el pedido.'],
      ['3. Recibís', 'Entregamos en Tucumán, listos para regalar.'],
    ].forEach(([title, body], i) => {
      const sx = M + i * (stepW + gap0);
      doc.setDrawColor(...GREEN);
      doc.line(sx, y, sx + stepW, y);
      text(title, sx, y + 7, { size: 11, bold: true, color: GREEN });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      text(doc.splitTextToSize(body, stepW), sx, y + 13, { size: 9.5 });
    });
  }

  // ---------- Páginas por tipo, de a 4 ----------
  const gap = 8;
  const cardW = (W - 2 * M - gap) / 2;
  const top = 18 + 22;
  const bottom = H - 22;
  const cardH = (bottom - top - gap) / 2;
  const imgH = cardH - 34;

  groups.forEach((g) => {
    for (let k = 0; k < g.items.length; k += 4) {
      doc.addPage();
      drawBand();
      const heading = (CATEGORY_HEADING[g.category] || g.category) + (k > 0 ? ' (continuación)' : '');
      text(heading, M, 32, { size: 18, bold: true, color: GREEN });
      if (engraving > 0) text(`Grabado: +${money(engraving)} c/u`, W - M, 32, { size: 10, color: GRAY, align: 'right' });
      doc.setDrawColor(218, 220, 198);
      doc.line(M, 35, W - M, 35);

      g.items.slice(k, k + 4).forEach(({ p, img }, idx) => {
        const x = M + (idx % 2) * (cardW + gap);
        const cy = top + Math.floor(idx / 2) * (cardH + gap);
        doc.setFillColor(248, 248, 241);
        doc.roundedRect(x, cy, cardW, cardH, 3, 3, 'F');
        if (img) {
          const scale = Math.min((cardW - 8) / img.w, (imgH - 8) / img.h);
          const w = img.w * scale;
          const h = img.h * scale;
          doc.addImage(img.dataUrl, img.format, x + (cardW - w) / 2, cy + 4 + (imgH - 8 - h) / 2, w, h);
        } else {
          text('Foto a pedido', x + cardW / 2, cy + imgH / 2, { size: 9, color: GRAY, align: 'center' });
        }
        let ty = cy + imgH + 6;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        const name = doc.splitTextToSize(p.name, cardW - 10).slice(0, 2);
        text(name, x + 5, ty, { size: 12, bold: true });
        ty += name.length * 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const desc = doc.splitTextToSize(p.description || '', cardW - 10).slice(0, 2);
        text(desc, x + 5, ty, { size: 9, color: GRAY });
        text(`${money(catalogPrice(p))} c/u`, x + cardW - 5, cy + cardH - 5, { size: 15, bold: true, color: GREEN, align: 'right' });
      });
    }
  });

  const total = doc.getNumberOfPages();
  for (let pg = 1; pg <= total; pg++) {
    doc.setPage(pg);
    drawFooter(pg, total);
  }
  return doc;
};

export default function CatalogoTab({ token, onAuthError, onProductsChanged }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  // Qué productos van al PDF: por defecto, los que tienen precio para empresas; se puede tildar o destildar cualquiera
  const [choices, setChoices] = useState({});
  const [prices, setPrices] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null');
      if (saved) {
        const merged = { ...DEFAULT_CONFIG, ...saved.config };
        if (!merged.contact || merged.contact === OLD_CONTACT) merged.contact = DEFAULT_CONFIG.contact;
        if (merged.conditions === OLD_CONDITIONS) merged.conditions = DEFAULT_CONFIG.conditions;
        setConfig(merged);
      }
      if (saved?.choices) setChoices(saved.choices);
      else if (saved?.excluded) setChoices(Object.fromEntries(saved.excluded.map((id) => [id, false])));
    } catch {}
    try {
      const probe = new File([''], 'x.pdf', { type: 'application/pdf' });
      setCanShare(!!navigator.canShare?.({ files: [probe] }));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify({ config, choices })); } catch {}
  }, [config, choices]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      try {
        const data = await productsAPI.getAllAdmin(token);
        setProducts(data);
        setPrices(Object.fromEntries(data.map((p) => [p._id, p.wholesalePrice ? String(p.wholesalePrice) : ''])));
      } catch (err) {
        if (!onAuthError(err)) toast.error('Error al cargar los productos');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, onAuthError]);

  const sorted = useMemo(
    () => [...products].sort((a, b) => (CATEGORY_ORDER[a.category] ?? 99) - (CATEGORY_ORDER[b.category] ?? 99) || a.name.localeCompare(b.name)),
    [products]
  );
  // Precio para empresas tal como está escrito en la lista (aunque todavía no se haya guardado)
  const typedWholesale = (p) => (prices[p._id] !== undefined ? Number(prices[p._id]) || 0 : p.wholesalePrice || 0);
  const isIncluded = (p) => choices[p._id] ?? typedWholesale(p) > 0;
  const included = sorted.filter(isIncluded);

  // Guarda el precio para empresas; devuelve false si no se pudo
  const savePrice = async (p) => {
    const value = typedWholesale(p);
    if (value === (p.wholesalePrice || 0)) return true;
    setSavingId(p._id);
    try {
      const updated = await productsAPI.update(p._id, { wholesalePrice: value }, token);
      if ((updated.wholesalePrice || 0) !== value) {
        toast.error('El servidor no guardó el precio para empresas. Puede que el servidor (Render) no esté actualizado.', { duration: 8000 });
        return false;
      }
      setProducts((list) => list.map((x) => (x._id === p._id ? updated : x)));
      onProductsChanged?.();
      return true;
    } catch (err) {
      if (!onAuthError(err)) toast.error(err.message || 'Error al guardar el precio');
      return false;
    } finally {
      setSavingId(null);
    }
  };

  const generate = async (share) => {
    if (!included.length) {
      return toast.error('Tildá los productos que querés en el catálogo (o escribiles el precio para empresas)', { duration: 6000 });
    }
    setGenerating(true);
    try {
      // Primero se guardan los precios que se escribieron y todavía no se guardaron
      await Promise.all(included.filter((p) => typedWholesale(p) !== (p.wholesalePrice || 0)).map(savePrice));
      // El PDF usa siempre el precio que se ve escrito en la lista
      const doc = await buildPdf(included.map((p) => ({ ...p, wholesalePrice: typedWholesale(p) })), config);
      const fileName = `catalogo-empresas-mate-noble-${new Date().toISOString().slice(0, 10)}.pdf`;
      if (share) {
        const file = new File([doc.output('blob')], fileName, { type: 'application/pdf' });
        await navigator.share({ files: [file], title: config.title });
      } else {
        doc.save(fileName);
        toast.success('Catálogo descargado');
      }
    } catch (err) {
      if (err?.name !== 'AbortError') toast.error('No se pudo generar el PDF');
    } finally {
      setGenerating(false);
    }
  };

  const field = (key, label, rows) => (
    <div>
      <label className="block text-sm font-medium text-mate-700 mb-1.5">{label}</label>
      {rows ? (
        <textarea rows={rows} className="input-base" value={config[key]} onChange={(e) => setConfig({ ...config, [key]: e.target.value })} />
      ) : (
        <input className="input-base" value={config[key]} onChange={(e) => setConfig({ ...config, [key]: e.target.value })} />
      )}
    </div>
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-mate-900">Pymes y empresas</h2>
          <p className="text-mate-500 text-sm">Un PDF con fotos y el precio para empresas, listo para mandar por WhatsApp o mail. No muestra tu costo.</p>
        </div>
        <div className="flex gap-2">
          {canShare && (
            <button onClick={() => generate(true)} disabled={generating}
              className="flex items-center justify-center gap-2 border border-mate-300 text-mate-800 px-4 py-2.5 rounded-xl font-medium hover:bg-mate-50 transition-colors disabled:opacity-60">
              <Share2 className="w-4 h-4" /> Compartir
            </button>
          )}
          <button onClick={() => generate(false)} disabled={generating || loading}
            className="flex items-center justify-center gap-2 bg-mate-800 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-mate-700 transition-colors disabled:opacity-60">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {generating ? 'Generando...' : 'Exportar catálogo PDF'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-5 space-y-4 h-fit">
          <h3 className="font-bold text-mate-900">Textos del PDF</h3>
          {field('title', 'Título')}
          {field('message', 'Mensaje de presentación', 4)}
          {field('conditions', 'Condiciones', 3)}
          {field('contact', 'Contacto (completá tu WhatsApp)')}
          <div>
            <label className="block text-sm font-medium text-mate-700 mb-1.5">Precio del grabado por unidad (ARS)</label>
            <input type="number" min="0" className="input-base" value={config.engravingPrice} onChange={(e) => setConfig({ ...config, engravingPrice: e.target.value })} placeholder="5000" />
            <p className="text-xs text-mate-400 mt-1">Sale en la portada y en cada página. Dejalo en 0 para no mostrarlo.</p>
          </div>
          <button type="button" onClick={() => setConfig(DEFAULT_CONFIG)} className="text-xs text-mate-500 hover:underline">
            Volver a los textos sugeridos
          </button>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm overflow-hidden h-fit">
          <div className="px-5 py-3 border-b border-mate-100 flex items-center justify-between">
            <h3 className="font-bold text-mate-900">Productos</h3>
            <span className={`text-sm ${included.length ? 'text-mate-500' : 'text-amber-600 font-medium'}`}>
              {included.length ? `${included.length} en el catálogo` : 'Ninguno todavía: tildá los que quieras'}
            </span>
          </div>
          {loading ? (
            <div className="p-10 text-center text-mate-400">Cargando...</div>
          ) : !sorted.length ? (
            <div className="p-10 text-center text-mate-400">Todavía no cargaste productos.</div>
          ) : (
            <div className="divide-y divide-mate-50 max-h-[36rem] overflow-y-auto">
              {sorted.map((p, idx) => {
                const price = Number(prices[p._id]) || 0;
                const inCatalog = isIncluded(p);
                const newGroup = idx === 0 || sorted[idx - 1].category !== p.category;
                return (
                  <Fragment key={p._id}>
                  {newGroup && (
                    <div className="px-4 pt-4 pb-1 font-serif text-lg font-semibold text-mate-800 bg-mate-50/60">
                      {CATEGORY_HEADING[p.category] || p.category}
                    </div>
                  )}
                  <div className={`flex items-center gap-3 px-4 py-3 ${inCatalog ? '' : 'opacity-60'}`}>
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-green-700"
                      checked={inCatalog}
                      onChange={() => setChoices((c) => ({ ...c, [p._id]: !inCatalog }))}
                      title="Incluir en el catálogo"
                    />
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-mate-50 flex-shrink-0">
                      {p.image && <Image src={p.image} alt={p.name} fill className="object-cover" sizes="48px" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-mate-800 truncate">{p.name}</p>
                      <p className="text-xs text-mate-400">
                        Costo {money(p.costPrice)} · Tienda {money(p.price)}
                        {price > 0 && (
                          <> · ganás <span className={price - p.costPrice >= 0 ? 'text-green-600' : 'text-red-500'}>{money(price - p.costPrice)}</span></>
                        )}
                      </p>
                      {inCatalog && !(p.wholesalePrice > 0) && (
                        <p className="text-xs text-amber-600">Va al PDF con el precio de tienda ({money(p.price)}). Poné un precio para empresas si querés otro.</p>
                      )}
                    </div>
                    <div className="w-32 flex-shrink-0">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          className="input-base !py-2 !text-sm pr-7"
                          placeholder="Precio empresas"
                          value={prices[p._id] ?? ''}
                          onChange={(e) => setPrices({ ...prices, [p._id]: e.target.value })}
                          onBlur={() => savePrice(p)}
                          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2">
                          {savingId === p._id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-mate-400" />
                            : p.wholesalePrice > 0 && price === p.wholesalePrice ? <Check className="w-3.5 h-3.5 text-green-600" /> : null}
                        </span>
                      </div>
                    </div>
                  </div>
                  </Fragment>
                );
              })}
            </div>
          )}
          {!loading && sorted.some((p) => !(p.wholesalePrice > 0)) && (
            <p className="px-5 py-3 text-xs text-mate-500 border-t border-mate-100 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Los productos sin precio para empresas no salen en el PDF. Escribí el precio y se guarda solo.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
