'use client';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';
import CartSidebar from './CartSidebar';
import AdminShortcut from './AdminShortcut';
import WhatsAppButton from './WhatsAppButton';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        <AdminShortcut />
        <Navbar />
        <CartSidebar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <WhatsAppButton />
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: '#393e29', color: '#f8f8f1', borderRadius: '10px' },
          }}
        />
      </CartProvider>
    </AuthProvider>
  );
}
