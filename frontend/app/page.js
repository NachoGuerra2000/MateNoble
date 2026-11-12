import Link from 'next/link';
import Image from 'next/image';
import { Truck, ShieldCheck, Hammer } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import FeaturedCarousel from '@/components/FeaturedCarousel';
import { WhatsAppIcon } from '@/components/WhatsAppButton';
import { waLink } from '@/lib/whatsapp';

const CATEGORIES = [
  { slug: 'calabaza', label: 'Calabaza' },
  { slug: 'algarrobo', label: 'Algarrobo' },
  { slug: 'acero', label: 'Acero' },
  { slug: 'materas', label: 'Materas' },
  { slug: 'bolsos', label: 'Bolsos' },
  { slug: 'bombillas', label: 'Bombillas' },
  { slug: 'bombillones', label: 'Bombillones' },
  { slug: 'combos', label: 'Combos' },
  { slug: 'otros', label: 'Otros' },
];

// Todos los productos visibles (con stock o por encargo)
async function getProducts() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/products`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

const STEPS = [
  { title: 'Cotizás', text: 'Nos contás cuántos necesitás y para cuándo.' },
  { title: 'Señás', text: 'Con el 50% confirmás el pedido.' },
  { title: 'Recibís', text: 'Entregamos en Tucumán, listos para regalar.' },
];

export default async function HomePage() {
  const products = await getProducts();
  const featured = products.filter((p) => p.featured);
  const showcase = (featured.length ? featured : products).slice(0, 8);

  // Solo las categorías que tienen algo para mostrar, con la foto de su primer producto
  const categories = CATEGORIES.map((c) => ({ ...c, product: products.find((p) => p.category === c.slug) })).filter((c) => c.product);

  return (
    <>
      {/* Hero: mismo verde que el fondo del logo, para que el logo se funda con la página */}
      <section className="bg-mate-700 text-mate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 md:py-20">
          <div className="grid gap-8 lg:gap-16 items-center grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
            <div className={`flex flex-col gap-6 lg:order-1 ${featured.length ? 'order-1' : 'order-2'}`}>
              <h1 className="text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-7xl font-semibold">
                Mates hechos a mano en Tucumán
              </h1>
              <p className="text-mate-200 text-lg leading-relaxed max-w-xl">
                Calabaza y algarrobo, materas y bombillas. Curados y listos para usar, con envío en Yerba Buena y San Miguel.
              </p>
              <div className="grid grid-cols-1 sm:flex gap-3">
                <Link
                  href="/productos"
                  className="inline-flex items-center justify-center bg-mate-50 text-mate-800 font-bold text-base px-8 py-4 rounded-full hover:bg-white transition-colors"
                >
                  Ver mates
                </Link>
                <a
                  href="#empresas"
                  className="inline-flex items-center justify-center border border-mate-200/70 text-mate-50 font-semibold text-base px-8 py-4 rounded-full hover:bg-mate-50/10 transition-colors"
                >
                  Regalos para empresas
                </a>
              </div>
            </div>

            <div className={`lg:order-2 ${featured.length ? 'order-2' : 'order-1'}`}>
              {featured.length > 0 ? (
                <FeaturedCarousel products={featured} />
              ) : (
                <div className="relative w-40 h-40 sm:w-56 sm:h-56 lg:w-[26rem] lg:h-[26rem] lg:mx-auto">
                  <Image src="/logo.jpg" alt="Logo de Mate Noble: termo y mate dentro de un círculo" fill priority className="object-contain" sizes="(max-width: 1024px) 224px, 416px" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categorías: solo las que tienen productos */}
      {categories.length > 1 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          <h2 className="text-3xl font-semibold text-mate-900 mb-5">Categorías</h2>
          <div className="no-scrollbar flex gap-5 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
            {categories.map((c) => (
              <Link key={c.slug} href={`/productos?categoria=${c.slug}`} className="snap-start flex-shrink-0 flex flex-col items-center gap-2 group">
                <span className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-mate-100 ring-1 ring-mate-200 group-hover:ring-2 group-hover:ring-mate-500 transition">
                  <Image src={c.product.images?.[0] || c.product.image} alt="" fill className="object-cover" sizes="96px" />
                </span>
                <span className="text-sm font-semibold text-mate-800">{c.label}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Productos */}
      {showcase.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-3xl font-semibold text-mate-900">{featured.length ? 'Los más elegidos' : 'Nuestros mates'}</h2>
            <Link href="/productos" className="text-sm font-semibold text-mate-700 hover:text-mate-900 underline-offset-4 hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {showcase.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}

      {/* Empresas */}
      <section id="empresas" className="mt-16 bg-mate-800 text-mate-50 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 grid gap-10 lg:grid-cols-[1.2fr_1fr] items-center">
          <div className="flex flex-col gap-5">
            <h2 className="text-4xl sm:text-5xl font-semibold leading-tight">Regalos para empresas, clubes y egresados</h2>
            <p className="text-mate-200 text-lg leading-relaxed max-w-xl">
              Mates con el logo de tu empresa o el escudo de tu club. Te pasamos el catálogo con precios por cantidad.
            </p>
            <a
              href={waLink('¡Hola Mate Noble! Quiero el catálogo de mates para empresas.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full sm:w-fit items-center justify-center gap-2 bg-whatsapp text-white font-bold px-7 py-4 rounded-full hover:brightness-110 transition"
            >
              <WhatsAppIcon className="w-5 h-5" />
              Pedir catálogo por WhatsApp
            </a>
          </div>
          <ol className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4 items-start border-t border-mate-600 pt-4">
                <span className="font-serif text-3xl leading-none text-mate-300 w-6">{i + 1}</span>
                <div>
                  <p className="font-bold text-mate-50">{s.title}</p>
                  <p className="text-mate-200 text-sm leading-relaxed">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Confianza */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Hammer, title: 'Hecho a mano', desc: 'Cada pieza es única, trabajada por artesanos con años de oficio.' },
            { icon: Truck, title: 'Envíos en Tucumán', desc: 'Sin cargo en Yerba Buena y con envío a San Miguel de Tucumán.' },
            { icon: ShieldCheck, title: 'Listos para usar', desc: 'Materiales seleccionados y curado para una larga vida útil.' },
          ].map((f) => (
            <div key={f.title} className="flex gap-4 items-start">
              <span className="w-11 h-11 rounded-full bg-mate-100 text-mate-700 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-mate-900">{f.title}</h3>
                <p className="text-mate-600 text-sm leading-relaxed mt-1">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
