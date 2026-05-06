'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { MapPin, User, Phone, ArrowRight, ShoppingBag } from 'lucide-react';

const SHIPPING_COST = 4000;

export default function CheckoutPage() {
  const { cartItems, total } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '', address: '', zone: '' });
  const [errors, setErrors] = useState({});

  if (cartItems.length === 0) {
    router.replace('/productos');
    return null;
  }

  const shipping = form.zone === 'san_miguel' ? SHIPPING_COST : 0;
  const finalTotal = total + shipping;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Ingresá tu nombre';
    if (!form.phone.trim()) e.phone = 'Ingresá tu teléfono';
    if (!form.address.trim()) e.address = 'Ingresá tu dirección';
    if (!form.zone) e.zone = 'Seleccioná tu zona';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;
    localStorage.setItem(
      'checkout',
      JSON.stringify({ customer: form, items: cartItems, subtotal: total, shipping, total: finalTotal })
    );
    router.push('/checkout/pago');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-mate-900 mb-8">Finalizar compra</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-mate-800 mb-5 flex items-center gap-2">
              <User className="w-5 h-5" /> Tus datos
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-mate-700 mb-1.5">Nombre completo *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`w-full border rounded-xl px-4 py-3 text-mate-900 outline-none focus:ring-2 focus:ring-mate-500 transition ${errors.name ? 'border-red-400' : 'border-mate-200'}`}
                  placeholder="Juan García"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-mate-700 mb-1.5">Teléfono / WhatsApp *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={`w-full border rounded-xl px-4 py-3 text-mate-900 outline-none focus:ring-2 focus:ring-mate-500 transition ${errors.phone ? 'border-red-400' : 'border-mate-200'}`}
                  placeholder="381 123-4567"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-mate-800 mb-5 flex items-center gap-2">
              <MapPin className="w-5 h-5" /> Dirección de entrega
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-mate-700 mb-1.5">Zona *</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'yerba_buena', label: 'Yerba Buena', sub: 'Sin costo de envío' },
                    { value: 'san_miguel', label: 'San Miguel', sub: `+$${SHIPPING_COST.toLocaleString('es-AR')} envío` },
                  ].map((z) => (
                    <button
                      key={z.value}
                      type="button"
                      onClick={() => setForm({ ...form, zone: z.value })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        form.zone === z.value
                          ? 'border-mate-600 bg-mate-50'
                          : 'border-mate-200 hover:border-mate-400'
                      }`}
                    >
                      <p className="font-semibold text-mate-900">{z.label}</p>
                      <p className={`text-xs mt-0.5 ${form.zone === z.value ? 'text-mate-700' : 'text-mate-400'}`}>
                        {z.sub}
                      </p>
                    </button>
                  ))}
                </div>
                {errors.zone && <p className="text-red-500 text-xs mt-1">{errors.zone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-mate-700 mb-1.5">Dirección completa *</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className={`w-full border rounded-xl px-4 py-3 text-mate-900 outline-none focus:ring-2 focus:ring-mate-500 transition ${errors.address ? 'border-red-400' : 'border-mate-200'}`}
                  placeholder="Av. Siempreviva 742, piso 2"
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-bold text-mate-800 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" /> Tu pedido
            </h2>

            <div className="space-y-2 mb-4">
              {cartItems.map((item) => (
                <div key={item._id} className="flex justify-between text-sm text-mate-700">
                  <span className="line-clamp-1 flex-1 mr-2">{item.name} x{item.quantity}</span>
                  <span className="font-medium whitespace-nowrap">${(item.price * item.quantity).toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-mate-100 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-mate-600">
                <span>Subtotal</span>
                <span>${total.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-mate-600">
                <span>Envío</span>
                <span>{shipping > 0 ? `$${shipping.toLocaleString('es-AR')}` : 'Sin costo'}</span>
              </div>
              <div className="flex justify-between text-mate-900 font-bold text-lg border-t border-mate-100 pt-2 mt-2">
                <span>Total</span>
                <span>${finalTotal.toLocaleString('es-AR')}</span>
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="mt-5 w-full flex items-center justify-center gap-2 bg-mate-700 hover:bg-mate-600 text-white font-bold py-4 rounded-2xl transition-colors shadow-md"
            >
              Continuar al pago
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
