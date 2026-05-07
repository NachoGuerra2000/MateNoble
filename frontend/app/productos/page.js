'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { productsAPI } from '@/lib/api';

const CATEGORIES = [
  { slug: '', label: 'Todos' },
  { slug: 'calabaza', label: 'Calabaza' },
  { slug: 'algarrobo', label: 'Algarrobo' },
  { slug: 'madera', label: 'Madera' },
  { slug: 'acero', label: 'Acero' },
  { slug: 'otros', label: 'Otros' },
];

export default function ProductosPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(searchParams.get('categoria') || '');
  const [showOutOfStock, setShowOutOfStock] = useState(false);

  useEffect(() => {
    setActiveCategory(searchParams.get('categoria') || '');
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = {};
        if (activeCategory) params.category = activeCategory;
        if (showOutOfStock) params.includeOutOfStock = 'true';
        const data = await productsAPI.getAll(params);
        setProducts(data);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeCategory, showOutOfStock]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-mate-900">Nuestros Productos</h1>
        <p className="text-mate-600 mt-1">
          {products.length} {products.length === 1 ? 'producto' : 'productos'} encontrados
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === cat.slug
                  ? 'bg-mate-700 text-white shadow-sm'
                  : 'bg-white text-mate-700 border border-mate-200 hover:border-mate-400 hover:bg-mate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <SlidersHorizontal className="w-4 h-4 text-mate-500" />
          <span className="text-sm text-mate-600">Mostrar sin stock</span>
          <div
            onClick={() => setShowOutOfStock(!showOutOfStock)}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer ${
              showOutOfStock ? 'bg-mate-600' : 'bg-mate-200'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                showOutOfStock ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </div>
        </label>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
              <div className="h-56 bg-mate-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-mate-100 rounded w-3/4" />
                <div className="h-3 bg-mate-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 text-mate-500">
          <div className="text-6xl mb-4">🍵</div>
          <p className="text-xl font-medium text-mate-700">No hay productos en esta categoría</p>
          <p className="text-sm mt-2">Probá con otra categoría o activá "Mostrar sin stock"</p>
          <button
            onClick={() => setActiveCategory('')}
            className="mt-6 px-6 py-2.5 bg-mate-700 text-white rounded-xl font-medium hover:bg-mate-600 transition-colors"
          >
            Ver todos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
