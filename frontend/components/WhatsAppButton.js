'use client';
import { usePathname } from 'next/navigation';
import { waLink } from '@/lib/whatsapp';

export function WhatsAppIcon({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.5-.3z" />
    </svg>
  );
}

// Botón flotante para escribir por WhatsApp; no aparece en el panel ni durante el pago
export default function WhatsAppButton() {
  const pathname = usePathname() || '';
  if (pathname.startsWith('/acceso') || pathname.startsWith('/checkout')) return null;

  return (
    <a
      href={waLink('¡Hola Mate Noble! Quería hacer una consulta.')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="fixed z-40 right-4 bottom-4 sm:right-6 sm:bottom-6 w-14 h-14 rounded-full bg-whatsapp text-white shadow-lg shadow-mate-900/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform focus-visible:outline focus-visible:outline-4 focus-visible:outline-mate-300"
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <WhatsAppIcon className="w-7 h-7" />
    </a>
  );
}
