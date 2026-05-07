'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Package } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';

const CATEGORY_LABELS = {
  calabaza: 'Calabaza',
  algarrobo: 'Algarrobo',
  madera: 'Madera',
  acero: 'Acero',
  otros: 'Otros',
};

export default function ProductCard({ product }) {
  const { addToCart, openCart } = useCart();
  const outOfStock = product.stock === 0;
  const originalPrice = Math.round(product.price * 1.15);

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product);
    toast.success(`${product.name} agregado al carrito`);
    openCart();
  };

  return (
    <Link href={`/productos/${product._id}`} className="group block">
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col h-full">
        {/* Image */}
        <div className="relative h-36 sm:h-56 bg-mate-50 overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {outOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-mate-800 text-sm font-semibold px-4 py-1.5 rounded-full">
                Sin stock
              </span>
            </div>
          )}
          <span className="absolute top-3 left-3 bg-mate-800/90 text-mate-100 text-xs font-medium px-2.5 py-1 rounded-full">
            {CATEGORY_LABELS[product.category] || product.category}
          </span>
        </div>

        {/* Content */}
        <div className="p-2 sm:p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-mate-900 text-xs sm:text-base leading-snug line-clamp-2">
            {product.name}
          </h3>
          <p className="hidden sm:block text-mate-500 text-sm mt-1.5 line-clamp-2 flex-1">{product.description}</p>

          <div className="mt-2 sm:mt-3">
            {!outOfStock ? (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-mate-800 font-bold text-sm sm:text-xl">
                  ${product.price.toLocaleString('es-AR')}
                </span>
                <span className="hidden sm:inline text-mate-400 line-through text-sm">
                  ${originalPrice.toLocaleString('es-AR')}
                </span>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  -15%
                </span>
              </div>
            ) : (
              <span className="text-mate-400 font-bold text-sm sm:text-xl">
                ${product.price.toLocaleString('es-AR')}
              </span>
            )}
            <div className="hidden sm:flex items-center gap-1 text-xs text-mate-500 mt-1">
              <Package className="w-3.5 h-3.5" />
              <span>{product.stock} disponibles</span>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={`mt-2 sm:mt-3 w-full flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
              outOfStock
                ? 'bg-mate-100 text-mate-400 cursor-not-allowed'
                : 'bg-mate-700 text-white hover:bg-mate-600 active:scale-95'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="sm:hidden">{outOfStock ? 'Sin stock' : 'Agregar'}</span>
            <span className="hidden sm:inline">{outOfStock ? 'Sin stock' : 'Agregar al carrito'}</span>
          </button>
        </div>
      </div>
    </Link>
  );
}
