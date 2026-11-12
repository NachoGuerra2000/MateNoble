'use client';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { FileDown, Share2, Loader2, Check, AlertCircle } from 'lucide-react';
import { productsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const CONFIG_KEY = 'catalogo-empresas-config';
const DEFAULT_CONFIG = {
  title: 'Mates para empresas',
  message:
    'Regalá tradición. Mates artesanales para tu equipo, tus clientes o tu evento de fin de año. Personalizamos con el logo de tu empresa o el escudo de tu club.',
  conditions:
    'Pedido mínimo: 10 unidades · Seña del 50% para confirmar y saldo contra entrega · Entregas en Tucumán · Consultá por grabado personalizado',
  contact: 'WhatsApp: 381 212-9848 · Instagram: @matenoble.tuc',
};
// Texto de contacto viejo (sin número) que pudo quedar guardado en el navegador
const OLD_CONTACT = 'Instagram: @matenoble.tuc · WhatsApp: ';

// Link de WhatsApp a partir del primer número de Tucumán que aparezca en el contacto (381 xxx-xxxx)
const whatsappLink = (contact) => {
  const digits = (contact || '').match(/381[\s-]?\d{3}[\s-]?\d{4}/)?.[0].replace(/\D/g, '');
  return digits ? `https://wa.me/549${digits}` : null;
};

const GREEN = [22, 71, 33];
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

const buildPdf = async (products, config) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const H = 297;
  const M = 14;
  const date = new Date().toLocaleDateString('es-AR');

  const logo = await loadImage('/logo.jpg').catch(() => null);
  const images = await Promise.all(products.map((p) => loadImage(lightUrl(p.image)).catch(() => null)));

  const drawHeader = (first) => {
    const h = first ? 40 : 18;
    doc.setFillColor(...GREEN);
    doc.rect(0, 0, W, h, 'F');
    if (logo) doc.addImage(logo.dataUrl, logo.format, M, first ? 8 : 3, first ? 24 : 12, first ? 24 : 12);
    const x = logo ? M + (first ? 30 : 16) : M;
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(first ? 22 : 13);
    doc.text(config.title || 'Catálogo', x, first ? 20 : 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(first ? 10 : 8);
    doc.text('Mate Noble · Tucumán', x, first ? 28 : 15);
    return h;
  };

  const drawFooter = (page, total) => {
    doc.setDrawColor(220, 230, 222);
    doc.line(M, H - 24, W - M, H - 24);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    const cond = doc.splitTextToSize(config.conditions || '', W - 2 * M);
    doc.text(cond.slice(0, 2), M, H - 19);
    doc.setTextColor(...GREEN);
    doc.setFont('helvetica', 'bold');
    doc.text(config.contact || '', M, H - 9);
    // Tocar el contacto en el PDF abre el chat de WhatsApp
    const wa = whatsappLink(config.contact);
    if (wa) doc.link(M, H - 13, doc.getTextWidth(config.contact), 6, { url: wa });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(`Precios por unidad, válidos al ${date} · Página ${page} de ${total}`, W - M, H - 9, { align: 'right' });
  };

  let y = drawHeader(true) + 10;
  if (config.message) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(config.message, W - 2 * M);
    doc.text(lines, M, y);
    y += lines.length * 5.2 + 6;
  }

  const gap = 8;
  const cardW = (W - 2 * M - gap) / 2;
  const imgH = 62;
  const cardH = imgH + 32;
  const bottom = H - 30;

  products.forEach((p, i) => {
    const col = i % 2;
    if (col === 0 && y + cardH > bottom) {
      doc.addPage();
      y = drawHeader(false) + 8;
    }
    const x = M + col * (cardW + gap);

    doc.setFillColor(244, 249, 245);
    doc.roundedRect(x, y, cardW, cardH, 3, 3, 'F');
    const img = images[i];
    if (img) {
      const scale = Math.min((cardW - 6) / img.w, (imgH - 6) / img.h);
      const w = img.w * scale;
      const h = img.h * scale;
      doc.addImage(img.dataUrl, img.format, x + (cardW - w) / 2, y + 3 + (imgH - 6 - h) / 2, w, h);
    } else {
      doc.setFontSize(9);
      doc.setTextColor(...GRAY);
      doc.text('Sin imagen', x + cardW / 2, y + imgH / 2, { align: 'center' });
    }

    let ty = y + imgH + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    const name = doc.splitTextToSize(p.name, cardW - 8).slice(0, 2);
    doc.text(name, x + 4, ty);
    ty += name.length * 4.6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    const desc = doc.splitTextToSize(p.description || '', cardW - 8).slice(0, 2);
    doc.text(desc, x + 4, ty);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...GREEN);
    doc.text(`${money(p.wholesalePrice)} c/u`, x + cardW - 4, y + cardH - 4, { align: 'right' });

    if (col === 1 || i === products.length - 1) y += cardH + gap;
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
  const [excluded, setExcluded] = useState([]);
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
        setConfig(merged);
      }
      if (saved?.excluded) setExcluded(saved.excluded);
    } catch {}
    try {
      const probe = new File([''], 'x.pdf', { type: 'application/pdf' });
      setCanShare(!!navigator.canShare?.({ files: [probe] }));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify({ config, excluded })); } catch {}
  }, [config, excluded]);

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
    () => [...products].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)),
    [products]
  );
  const included = sorted.filter((p) => p.wholesalePrice > 0 && !excluded.includes(p._id));

  const savePrice = async (p) => {
    const value = Number(prices[p._id]) || 0;
    if (value === (p.wholesalePrice || 0)) return;
    setSavingId(p._id);
    try {
      const updated = await productsAPI.update(p._id, { wholesalePrice: value }, token);
      setProducts((list) => list.map((x) => (x._id === p._id ? updated : x)));
      onProductsChanged?.();
    } catch (err) {
      if (!onAuthError(err)) toast.error(err.message || 'Error al guardar el precio');
    } finally {
      setSavingId(null);
    }
  };

  const generate = async (share) => {
    if (!included.length) {
      return toast.error('Todavía no hay productos en el catálogo: escribí el "precio para empresas" de cada mate en la lista de abajo', { duration: 6000 });
    }
    setGenerating(true);
    try {
      const doc = await buildPdf(included, config);
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
          <button type="button" onClick={() => setConfig(DEFAULT_CONFIG)} className="text-xs text-mate-500 hover:underline">
            Volver a los textos sugeridos
          </button>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm overflow-hidden h-fit">
          <div className="px-5 py-3 border-b border-mate-100 flex items-center justify-between">
            <h3 className="font-bold text-mate-900">Productos</h3>
            <span className={`text-sm ${included.length ? 'text-mate-500' : 'text-amber-600 font-medium'}`}>
              {included.length ? `${included.length} en el catálogo` : 'Ninguno todavía: poné el precio para empresas'}
            </span>
          </div>
          {loading ? (
            <div className="p-10 text-center text-mate-400">Cargando...</div>
          ) : !sorted.length ? (
            <div className="p-10 text-center text-mate-400">Todavía no cargaste productos.</div>
          ) : (
            <div className="divide-y divide-mate-50 max-h-[36rem] overflow-y-auto">
              {sorted.map((p) => {
                const price = Number(prices[p._id]) || 0;
                const inCatalog = p.wholesalePrice > 0 && !excluded.includes(p._id);
                return (
                  <div key={p._id} className={`flex items-center gap-3 px-4 py-3 ${inCatalog ? '' : 'opacity-60'}`}>
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-green-700"
                      checked={inCatalog}
                      disabled={!(p.wholesalePrice > 0)}
                      onChange={() => setExcluded((ex) => (ex.includes(p._id) ? ex.filter((x) => x !== p._id) : [...ex, p._id]))}
                      title={p.wholesalePrice > 0 ? 'Incluir en el catálogo' : 'Poné un precio para empresas para incluirlo'}
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
