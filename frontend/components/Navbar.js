'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ShoppingCart, Menu, X, Leaf, LayoutDashboard } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { itemCount, openCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-mate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity">
            <Leaf className="w-6 h-6 text-mate-300" />
            <span className="text-xl font-bold tracking-tight">Mate Noble</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-mate-100 hover:text-white transition-colors text-sm font-medium">
              Inicio
            </Link>
            <Link href="/productos" className="text-mate-100 hover:text-white transition-colors text-sm font-medium">
              Productos
            </Link>
            {isAuthenticated && (
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-1.5 bg-mate-600 hover:bg-mate-500 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Panel Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={openCart}
              className="relative p-2 text-mate-100 hover:text-white transition-colors"
              aria-label="Abrir carrito"
            >
              <ShoppingCart className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-mate-400 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>

            <button
              className="md:hidden p-2 text-mate-100 hover:text-white transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-mate-900 border-t border-mate-700 px-4 py-4 space-y-3">
          <Link href="/" onClick={() => setMenuOpen(false)} className="block text-mate-100 hover:text-white font-medium">
            Inicio
          </Link>
          <Link href="/productos" onClick={() => setMenuOpen(false)} className="block text-mate-100 hover:text-white font-medium">
            Productos
          </Link>
          {isAuthenticated && (
            <Link
              href="/admin/dashboard"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 bg-mate-600 text-white font-semibold px-4 py-2 rounded-lg w-fit"
            >
              <LayoutDashboard className="w-4 h-4" />
              Panel Admin
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
