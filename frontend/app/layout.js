import Providers from '@/components/Providers';
import './globals.css';

export const metadata = {
  title: 'Mates Artesanales | Tienda Online',
  description: 'Los mejores mates artesanales de calabaza, algarrobo y madera. Calidad y tradición en cada pieza.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
