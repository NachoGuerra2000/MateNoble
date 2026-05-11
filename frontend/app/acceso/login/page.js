'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace('/acceso/dashboard');
  }, [isAuthenticated, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error('Completá todos los campos');
      return;
    }
    setLoading(true);
    try {
      const data = await authAPI.login(form);
      login(data.token, data.username);
      toast.success(`Bienvenido, ${data.username}`);
      router.push('/acceso/dashboard');
    } catch (err) {
      toast.error(err.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mate-900 to-mate-700 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-mate-100 rounded-2xl mb-4">
            <Leaf className="w-7 h-7 text-mate-700" />
          </div>
          <h1 className="text-2xl font-bold text-mate-900">Panel Admin</h1>
          <p className="text-mate-500 text-sm mt-1">Acceso exclusivo para administradores</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-mate-700 mb-1.5">
              Usuario
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full border border-mate-200 rounded-xl px-4 py-3 text-mate-900 focus:outline-none focus:ring-2 focus:ring-mate-500 focus:border-transparent transition"
              placeholder="admin"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-mate-700 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-mate-200 rounded-xl px-4 py-3 pr-12 text-mate-900 focus:outline-none focus:ring-2 focus:ring-mate-500 focus:border-transparent transition"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mate-400 hover:text-mate-600 transition-colors"
              >
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-mate-800 text-white py-3.5 rounded-xl font-semibold hover:bg-mate-700 transition-colors active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
