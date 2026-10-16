'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Acceso oculto al panel de administración: Ctrl + Alt + B
export default function AdminShortcut() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.altKey && !e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        router.push('/acceso/login');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return null;
}
