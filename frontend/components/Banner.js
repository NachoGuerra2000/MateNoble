import Link from 'next/link';

export default function Banner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-mate-900 via-mate-800 to-mate-600 text-white">
      <div className="absolute top-0 right-0 w-96 h-96 bg-mate-500/20 rounded-full translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-mate-700/30 rounded-full -translate-x-1/3 translate-y-1/3" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-40">
        <div className="max-w-2xl">
          <span className="inline-block bg-mate-500/40 border border-mate-400/50 text-mate-100 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            Artesanía argentina
          </span>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6">
            Mate Noble
            <span className="block text-mate-300 text-3xl md:text-4xl font-medium mt-2">
              La tradición en cada sorbo
            </span>
          </h1>
          <p className="text-mate-100 text-lg md:text-xl leading-relaxed mb-12 max-w-xl">
            Mates artesanales de calabaza, algarrobo y madera. Piezas únicas hechas a mano
            por artesanos con años de oficio.
          </p>
          <div className="flex flex-col sm:flex-row gap-5">
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
      </div>
    </section>
  );
}
