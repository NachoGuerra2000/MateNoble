'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function FeaturedCarousel({ products }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = products.length;

  const goTo = useCallback((i) => setIndex(((i % count) + count) % count), [count]);
  const next = useCallback(() => goTo(index + 1), [index, goTo]);
  const prev = useCallback(() => goTo(index - 1), [index, goTo]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 4500);
    return () => clearInterval(timer);
  }, [count, paused]);

  if (!count) return null;
  const product = products[index];
  const href = `/productos/${product._id}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-mate-200 font-semibold text-sm uppercase tracking-wide">Destacados</p>
        <Link href="/productos" className="text-mate-300 hover:text-white text-sm transition-colors">
          Ver todos →
        </Link>
      </div>

      <div
        className="bg-white/10 border border-white/20 rounded-3xl overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="relative h-72 sm:h-96 bg-mate-700/30">
          <Link href={href} className="absolute inset-0 block group">
            <Image
              key={product._id}
              src={product.images?.[0] || product.image}
              alt={product.name}
              fill
              className="object-contain p-8 group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 1024px) 100vw, 550px"
              priority
            />
          </Link>

          {count > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
                aria-label="Destacado anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
                aria-label="Siguiente destacado"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        <Link href={href} className="block p-5">
          <p className="text-white text-lg font-semibold line-clamp-1">{product.name}</p>
          <p className="text-mate-300 text-sm mt-0.5">${product.price.toLocaleString('es-AR')}</p>
        </Link>
      </div>

      {count > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {products.map((p, i) => (
            <button
              key={p._id}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`}
              aria-label={`Ir al destacado ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
