'use client';
import Image from 'next/image';
import Link from 'next/link';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CartSidebar() {
  const { cartItems, removeFromCart, updateQuantity, total, itemCount, isOpen, closeCart } =
    useCart();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-mate-100 bg-mate-800 text-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="font-semibold text-lg">Mi carrito</h2>
            {itemCount > 0 && (
              <span className="bg-mate-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {itemCount}
              </span>
            )}
          </div>
          <button onClick={closeCart} className="p-1 hover:opacity-75 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-mate-400 gap-3">
              <ShoppingBag className="w-16 h-16 opacity-30" />
              <p className="text-base font-medium">Tu carrito está vacío</p>
              <p className="text-sm text-center">Explorá nuestra colección y agregá tus mates favoritos</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item._id} className="flex gap-3 bg-mate-50 rounded-xl p-3">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-mate-100">
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-mate-900 text-sm line-clamp-2 leading-tight">
                    {item.name}
                  </h4>
                  <p className="text-mate-600 font-semibold text-sm mt-1">
                    ${item.price.toLocaleString('es-AR')}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 border border-mate-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        className="p-1 hover:bg-mate-100 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5 text-mate-700" />
                      </button>
                      <span className="w-7 text-center text-sm font-medium text-mate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="p-1 hover:bg-mate-100 transition-colors disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5 text-mate-700" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-mate-100 px-5 py-4 space-y-3 bg-white">
            <div className="flex items-center justify-between text-mate-900">
              <span className="font-semibold text-lg">Total</span>
              <span className="font-bold text-2xl text-mate-800">
                ${total.toLocaleString('es-AR')}
              </span>
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="w-full flex items-center justify-center bg-mate-700 text-white py-3.5 rounded-xl font-semibold hover:bg-mate-600 transition-colors active:scale-95"
            >
              Finalizar compra
            </Link>
            <button
              onClick={closeCart}
              className="w-full text-mate-600 text-sm hover:text-mate-800 transition-colors"
            >
              Seguir comprando
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
