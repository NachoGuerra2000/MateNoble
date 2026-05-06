'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useCart } from '@/context/CartContext';
import { CheckCircle, Copy, Loader2, Upload, ImageIcon, X } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const MP_ALIAS = process.env.NEXT_PUBLIC_MP_ALIAS || 'tu.alias.mp';
const MP_LINK  = process.env.NEXT_PUBLIC_MP_LINK  || 'https://www.mercadopago.com.ar';

const STEPS = ['Transferí', 'Subí el comprobante', 'Confirmá'];

export default function PagoPage() {
  const router = useRouter();
  const { clearCart } = useCart();
  const [checkoutData, setCheckoutData]   = useState(null);
  const [copied, setCopied]               = useState(false);
  const [comprobante, setComprobante]     = useState(null); // URL final
  const [preview, setPreview]             = useState(null); // preview local
  const [uploading, setUploading]         = useState(false);
  const [confirming, setConfirming]       = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    const data = localStorage.getItem('checkout');
    if (!data) { router.replace('/checkout'); return; }
    setCheckoutData(JSON.parse(data));
  }, [router]);

  const handleCopy = () => {
    navigator.clipboard.writeText(MP_ALIAS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch(`${API_URL}/upload/comprobante`, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setComprobante(data.url);
      toast.success('Comprobante subido correctamente');
    } catch {
      toast.error('Error al subir el comprobante, intentá de nuevo');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!comprobante) {
      toast.error('Primero subí el comprobante de transferencia');
      return;
    }
    setConfirming(true);
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer:   checkoutData.customer,
          items:      checkoutData.items.map((i) => ({
            productId: i._id, name: i.name, price: i.price, quantity: i.quantity,
          })),
          subtotal:    checkoutData.subtotal,
          comprobante,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      clearCart();
      localStorage.removeItem('checkout');
      router.push('/checkout/confirmacion');
    } catch (err) {
      toast.error(err.message || 'Error al confirmar el pedido');
      setConfirming(false);
    }
  };

  if (!checkoutData) return null;

  const ZONE_LABELS = { yerba_buena: 'Yerba Buena', san_miguel: 'San Miguel de Tucumán' };
  const currentStep = comprobante ? 2 : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-mate-900 mb-2">Realizar el pago</h1>
      <p className="text-mate-500 mb-6">Seguí los pasos para completar tu compra.</p>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
              i <= currentStep ? 'bg-mate-700 text-white' : 'bg-mate-100 text-mate-400'
            }`}>
              {i < currentStep ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i <= currentStep ? 'text-mate-800' : 'text-mate-400'}`}>
              {s}
            </span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-mate-200 mx-1" />}
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="bg-mate-700 text-white rounded-2xl p-5 mb-6 text-center">
        <p className="text-mate-200 text-sm mb-1">Total a transferir</p>
        <p className="text-4xl font-bold">${checkoutData.total.toLocaleString('es-AR')}</p>
        {checkoutData.shipping > 0 && (
          <p className="text-mate-300 text-xs mt-1">
            (incluye ${checkoutData.shipping.toLocaleString('es-AR')} de envío a {ZONE_LABELS[checkoutData.customer.zone]})
          </p>
        )}
      </div>

      {/* PASO 1 — Transferir */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
        <h2 className="text-base font-bold text-mate-800 mb-1">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-mate-700 text-white rounded-full text-xs mr-2">1</span>
          Transferí el monto exacto
        </h2>
        <p className="text-sm text-mate-500 mb-5 ml-8">Escaneá el QR o copiá el alias desde tu app de pagos.</p>

        <div className="flex justify-center mb-5">
          <div className="p-4 border-4 border-mate-100 rounded-2xl bg-white">
            <QRCodeSVG value={MP_LINK} size={180} bgColor="#ffffff" fgColor="#164721" level="H" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-mate-500 mb-2">Alias de MercadoPago / transferencia:</p>
          <div className="inline-flex items-center gap-2 bg-mate-50 border border-mate-200 rounded-xl px-5 py-3">
            <span className="font-bold text-mate-800 text-lg tracking-wide">{MP_ALIAS}</span>
            <button onClick={handleCopy} className="text-mate-400 hover:text-mate-700 transition-colors">
              {copied ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          {copied && <p className="text-green-600 text-xs mt-1">¡Copiado!</p>}
        </div>
      </div>

      {/* PASO 2 — Subir comprobante */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
        <h2 className="text-base font-bold text-mate-800 mb-1">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-mate-700 text-white rounded-full text-xs mr-2">2</span>
          Subí el comprobante
        </h2>
        <p className="text-sm text-mate-500 mb-4 ml-8">
          Sacá una captura de pantalla o foto del comprobante de transferencia y subila acá.
        </p>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        {preview ? (
          <div className="relative">
            <div className="relative w-full h-52 rounded-xl overflow-hidden border border-mate-200">
              <Image src={preview} alt="Comprobante" fill className="object-contain" sizes="600px" />
              {uploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-mate-700" />
                </div>
              )}
            </div>
            {!uploading && (
              <button
                onClick={() => { setPreview(null); setComprobante(null); }}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow text-mate-500 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {comprobante && !uploading && (
              <p className="text-green-600 text-sm font-medium mt-2 text-center flex items-center justify-center gap-1">
                <CheckCircle className="w-4 h-4" /> Comprobante subido correctamente
              </p>
            )}
          </div>
        ) : (
          <button
            onClick={() => fileRef.current.click()}
            className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-mate-300 hover:border-mate-500 rounded-xl py-8 text-mate-500 hover:text-mate-800 transition-colors"
          >
            <ImageIcon className="w-10 h-10 opacity-40" />
            <span className="font-medium">Tocá para subir el comprobante</span>
            <span className="text-xs opacity-60">JPG, PNG o captura de pantalla</span>
          </button>
        )}
      </div>

      {/* PASO 3 — Confirmar */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
        <h2 className="text-base font-bold text-mate-800 mb-4">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-mate-700 text-white rounded-full text-xs mr-2">3</span>
          Confirmá tu pedido
        </h2>

        <button
          onClick={handleConfirm}
          disabled={confirming || !comprobante || uploading}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold text-lg py-4 rounded-2xl transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {confirming
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Confirmando...</>
            : <><CheckCircle className="w-5 h-5" /> Confirmar pedido</>
          }
        </button>
        {!comprobante && (
          <p className="text-center text-xs text-mate-400 mt-2">
            Primero subí el comprobante para poder confirmar.
          </p>
        )}
      </div>
    </div>
  );
}
