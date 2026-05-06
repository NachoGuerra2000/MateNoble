'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ShoppingCart, Package, ArrowLeft, X, ZoomIn } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { productsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const CATEGORY_LABELS = {
  calabaza: 'Calabaza',
  algarrobo: 'Algarrobo',
  madera: 'Madera',
  acero: 'Acero',
  otros: 'Otros',
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart, openCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    productsAPI.getById(id)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) addToCart(product);
    toast.success(`${product.name} agregado al carrito`);
    openCart();
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="h-96 bg-mate-100 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-mate-100 rounded w-3/4" />
            <div className="h-4 bg-mate-100 rounded w-1/3" />
            <div className="h-24 bg-mate-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center">
        <p className="text-xl text-mate-600">Producto no encontrado.</p>
        <Link href="/productos" className="mt-4 inline-block text-mate-700 underline">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  const outOfStock = product.stock === 0;
  const originalPrice = Math.round(product.price * 1.15);

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back */}
        <Link
          href="/productos"
          className="inline-flex items-center gap-1.5 text-mate-600 hover:text-mate-900 transition-colors mb-8 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al catálogo
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          {/* Image */}
          <div
            className="relative bg-mate-50 rounded-2xl overflow-hidden cursor-zoom-in group"
            style={{ minHeight: '380px' }}
            onClick={() => setLightboxOpen(true)}
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain p-4"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                <ZoomIn className="w-5 h-5 text-mate-800" />
              </div>
            </div>
            {outOfStock && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="bg-white text-mate-800 font-semibold px-5 py-2 rounded-full text-sm">
                  Sin stock
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <span className="inline-block bg-mate-100 text-mate-700 text-xs font-semibold px-3 py-1 rounded-full w-fit mb-3">
              {CATEGORY_LABELS[product.category] || product.category}
            </span>

            <h1 className="text-3xl font-bold text-mate-900 leading-tight">{product.name}</h1>

            {/* Price */}
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              {!outOfStock ? (
                <>
                  <span className="text-3xl font-bold text-mate-800">
                    ${product.price.toLocaleString('es-AR')}
                  </span>
                  <span className="text-mate-400 line-through text-lg">
                    ${originalPrice.toLocaleString('es-AR')}
                  </span>
                  <span className="bg-green-100 text-green-700 font-bold text-sm px-3 py-1 rounded-full">
                    -15% OFF
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-mate-400">
                  ${product.price.toLocaleString('es-AR')}
                </span>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2 mt-3">
              <Package className="w-4 h-4 text-mate-500" />
              <span className={`text-sm font-medium ${outOfStock ? 'text-red-500' : 'text-mate-600'}`}>
                {outOfStock ? 'Sin stock disponible' : `${product.stock} unidades disponibles`}
              </span>
            </div>

            {/* Description */}
            <div className="mt-6 border-t border-mate-100 pt-6">
              <h2 className="text-sm font-semibold text-mate-700 uppercase tracking-wide mb-2">
                Descripción
              </h2>
              <p className="text-mate-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Quantity + Add to cart */}
            {!outOfStock && (
              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-mate-700">Cantidad:</span>
                  <div className="flex items-center border border-mate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 text-mate-700 hover:bg-mate-100 transition-colors font-bold text-lg"
                    >
                      −
                    </button>
                    <span className="px-5 py-2 font-semibold text-mate-900 text-base border-x border-mate-200">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="px-4 py-2 text-mate-700 hover:bg-mate-100 transition-colors font-bold text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="w-full flex items-center justify-center gap-2 bg-mate-700 hover:bg-mate-600 text-white font-bold text-lg py-4 rounded-2xl transition-colors active:scale-95 transition-transform shadow-md"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Agregar al carrito
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-mate-300 transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-8 h-8" />
          </button>
          <div
            className="relative w-full max-w-3xl"
            style={{ height: '80vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </>
  );
}
