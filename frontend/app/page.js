import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/ProductCard';

const CATEGORIES = [
  { slug: 'calabaza', label: 'Calabaza', emoji: '🍵', desc: 'La base de la tradición' },
  { slug: 'algarrobo', label: 'Algarrobo', emoji: '🪵', desc: 'Madera del norte argentino' },
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
      {/* Hero dividido */}
      <section className="relative overflow-hidden bg-gradient-to-br from-mate-900 via-mate-800 to-mate-600 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-mate-500/20 rounded-full translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-mate-700/30 rounded-full -translate-x-1/3 translate-y-1/3" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className={`grid gap-12 items-center ${featured.length > 0 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Texto */}
            <div className={featured.length > 0 ? '' : 'max-w-2xl'}>
              <div className="flex items-center gap-3 mb-6">
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-mate-600 flex-shrink-0 border-2 border-mate-400">
                  <Image src="/logo.jpg" alt="Mate Noble" fill className="object-cover" sizes="56px" />
                </div>
                <span className="inline-block bg-mate-500/40 border border-mate-400/50 text-mate-100 text-sm font-medium px-4 py-1.5 rounded-full">
                  Artesanía argentina
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
                Mate Noble
                <span className="block text-mate-300 text-3xl md:text-4xl font-medium mt-2">
                  La tradición en cada sorbo
                </span>
              </h1>
              <p className="text-mate-100 text-lg leading-relaxed mb-10 max-w-xl">
                Mates artesanales de calabaza y algarrobo. Piezas únicas hechas a mano
                por artesanos con años de oficio.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/productos"
                  className="inline-flex items-center justify-center bg-white text-mate-800 font-bold text-lg px-10 py-4 rounded-2xl hover:bg-mate-100 transition-colors shadow-xl"
                >
                  Ver colección
                </Link>
                <Link
                  href="/productos?categoria=calabaza"
                  className="inline-flex items-center justify-center border-2 border-white text-white font-bold text-lg px-10 py-4 rounded-2xl hover:bg-white/15 transition-colors"
                >
                  Mate Calabaza
                </Link>
              </div>
            </div>

            {/* Productos destacados en el hero */}
            {featured.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-mate-200 font-semibold text-sm uppercase tracking-wide">Destacados</p>
                  <Link href="/productos" className="text-mate-300 hover:text-white text-sm transition-colors">
                    Ver todos →
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {featured.slice(0, 4).map((p) => (
                    <Link
                      key={p._id}
                      href={`/productos/${p._id}`}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl overflow-hidden transition-all duration-200 group"
                    >
                      <div className="relative h-32 bg-mate-700/30">
                        <Image
                          src={p.images?.[0] || p.image}
                          alt={p.name}
                          fill
                          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                          sizes="200px"
                        />
                      </div>
                      <div className="p-3">
                        <p className="text-white text-xs font-semibold line-clamp-1">{p.name}</p>
                        <p className="text-mate-300 text-xs mt-0.5">${p.price.toLocaleString('es-AR')}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="bg-mate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white">Explorar por categoría</h2>
            <p className="text-mate-200 mt-2">Encontrá el mate ideal para vos</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            { icon: '🚚', title: 'Envíos a Yerba Buena y San Miguel', desc: 'Realizamos envíos dentro de Yerba Buena y San Miguel con embalaje seguro.' },
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
