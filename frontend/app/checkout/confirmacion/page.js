import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function ConfirmacionPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>

      <h1 className="text-3xl font-bold text-mate-900 mb-3">¡Pedido confirmado!</h1>
      <p className="text-mate-600 text-lg leading-relaxed mb-8">
        Gracias por tu compra. Recibimos tu pedido y lo procesaremos en cuanto confirmemos el pago.
        Te contactaremos por WhatsApp para coordinar la entrega.
      </p>

      <div className="bg-mate-50 rounded-2xl p-5 mb-8 text-sm text-mate-700 space-y-1">
        <p>📦 Tu pedido está siendo preparado</p>
        <p>📲 Te contactamos al número que dejaste</p>
        <p>🏠 Entregamos en la dirección indicada</p>
      </div>

      <Link
        href="/"
        className="inline-flex items-center justify-center bg-mate-700 hover:bg-mate-600 text-white font-bold px-8 py-3.5 rounded-2xl transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
