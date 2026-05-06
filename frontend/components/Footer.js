import Link from 'next/link';
import { Leaf, Instagram, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-mate-900 text-mate-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Leaf className="w-5 h-5 text-mate-400" />
              <span className="text-lg font-bold text-white">Mate Noble</span>
            </div>
            <p className="text-sm text-mate-300 leading-relaxed">
              Artesanía y tradición en cada mate. Piezas únicas hechas con amor y dedicación.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Navegación</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
              <li><Link href="/productos" className="hover:text-white transition-colors">Productos</Link></li>
              <li><Link href="/productos?categoria=calabaza" className="hover:text-white transition-colors">Mate Calabaza</Link></li>
              <li><Link href="/productos?categoria=algarrobo" className="hover:text-white transition-colors">Mate Algarrobo</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Contacto</h3>
            <ul className="space-y-3 text-sm text-mate-300">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-mate-400" />
                <span>3812129848</span>
              </li>
              <li className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-mate-400" />
                <a
                  href="https://instagram.com/matenoble.tuc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  @matenoble.tuc
                </a>
              </li>
              <li>Envíos a todo el país</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-mate-700 mt-10 pt-6 text-center text-xs text-mate-500">
          © {new Date().getFullYear()} Mate Noble. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
