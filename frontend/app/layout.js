import { Cormorant_Garamond, Figtree } from 'next/font/google';
import Providers from '@/components/Providers';
import './globals.css';

// Serif clásica como la del logo para títulos; sans clara para textos y precios
const serif = Cormorant_Garamond({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-serif', display: 'swap' });
const sans = Figtree({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-sans', display: 'swap' });

export const metadata = {
  title: 'Mate Noble | Mates artesanales en Tucumán',
  description: 'Mates artesanales de calabaza y algarrobo, materas y bombillas. Envíos en Yerba Buena y San Miguel de Tucumán. Regalos para empresas.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
