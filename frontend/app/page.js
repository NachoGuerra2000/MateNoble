import Link from 'next/link';
import Banner from '@/components/Banner';
import ProductCard from '@/components/ProductCard';

const CATEGORIES = [
  { slug: 'calabaza', label: 'Calabaza', emoji: '🍵', desc: 'La base de la tradición' },
  { slug: 'algarrobo', label: 'Algarrobo', emoji: '🪵', desc: 'Madera del norte argentino' },
  { slug: 'madera', label: 'Madera', emoji: '🌿', desc: 'Distintas maderas nativas' },
  { slug: 'acero', label: 'Acero', emoji: '⚗️', desc: 'Resistente y moderno' },
  { slug: 'otros', label: 'Otros', emoji: '✨', desc: 'Nuevas propuestas' },
];

async function getFeaturedProducts() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/products?featured=true`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <>
      <Banner />

      {/* Productos Destacados */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-mate-900">Productos Destacados</h2>
            <p className="text-mate-600 mt-1">Las piezas favoritas de nuestros clientes</p>
          </div>
          <Link
            href="/productos"
            className="hidden sm:inline-flex text-mate-700 font-medium hover:text-mate-900 transition-colors text-sm border border-mate-300 px-4 py-2 rounded-lg hover:bg-mate-100"
          >
            Ver todos →
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="text-center py-16 text-mate-500">
            <p className="text-lg">Próximamente productos destacados...</p>
            <Link href="/productos" className="mt-4 inline-block text-mate-700 font-medium underline">
              Ver catálogo completo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featured.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}

        <div className="text-center mt-8 sm:hidden">
          <Link href="/productos" className="text-mate-700 font-medium hover:text-mate-900 transition-colors">
            Ver todos los productos →
          </Link>
        </div>
      </section>

      {/* Categorías */}
      <section className="bg-mate-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Explorar por categoría</h2>
            <p className="text-mate-200 mt-2">Encontrá el mate ideal para vos</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/productos?categoria=${cat.slug}`}
                className="bg-mate-700/60 hover:bg-mate-600 border border-mate-600/50 hover:border-mate-400 rounded-2xl p-6 text-center transition-all duration-200 group"
              >
                <div className="text-4xl mb-3">{cat.emoji}</div>
                <div className="text-white font-semibold">{cat.label}</div>
                <div className="text-mate-300 text-xs mt-1 group-hover:text-mate-200 transition-colors">
                  {cat.desc}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { icon: '🤝', title: 'Hecho a mano', desc: 'Cada pieza es única, trabajada por artesanos con años de experiencia.' },
            { icon: '🚚', title: 'Envíos a todo el país', desc: 'Despachamos a cualquier punto de Argentina con embalaje seguro.' },
            { icon: '⭐', title: 'Calidad garantizada', desc: 'Materiales seleccionados y curado premium para una larga vida útil.' },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl bg-white shadow-sm border border-mate-100">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-mate-900 text-lg mb-2">{f.title}</h3>
              <p className="text-mate-600 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
