'use client';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';
import CartSidebar from './CartSidebar';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        <Navbar />
        <CartSidebar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: '#5c3a1e', color: '#fdf8f3', borderRadius: '8px' },
          }}
        />
      </CartProvider>
    </AuthProvider>
  );
}
