'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Pencil, Trash2, LogOut, Package, AlertCircle, X, Upload, ImageIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { productsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const CATEGORIES = [
  { value: 'calabaza', label: 'Calabaza' },
  { value: 'algarrobo', label: 'Algarrobo' },
  { value: 'acero', label: 'Acero' },
  { value: 'otros', label: 'Otros' },
];

const EMPTY_FORM = {
  name: '', price: '', image: '', images: [], description: '',
  category: 'calabaza', stock: '', featured: false, active: true,
};

export default function AdminDashboard() {
  const { token, username, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const multiFileInputRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) router.replace('/admin/login');
  }, [isAuthenticated, router]);

  const loadProducts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await productsAPI.getAllAdmin(token);
      setProducts(data);
    } catch {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setForm((prev) => ({
        ...prev,
        image: data.url,
        images: prev.images.length === 0 ? [data.url] : [data.url, ...prev.images.slice(1)],
      }));
      setImagePreview(data.url);
      toast.success('Imagen principal subida');
    } catch (err) {
      toast.error(err.message || 'Error al subir imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleExtraImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('images', f));
      const res = await fetch(`${API_URL}/upload/multiple`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setForm((prev) => ({ ...prev, images: [...prev.images, ...data.urls] }));
      toast.success(`${data.urls.length} imagen(es) agregada(s)`);
    } catch (err) {
      toast.error(err.message || 'Error al subir imágenes');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const removeExtraImage = (url) => {
    setForm((prev) => {
      const newImages = prev.images.filter((u) => u !== url);
      const newImage = newImages[0] || '';
      return { ...prev, images: newImages, image: newImage };
    });
    if (imagePreview === url) setImagePreview(form.images.find((u) => u !== url) || null);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setImagePreview(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    const images = product.images?.length ? product.images : (product.image ? [product.image] : []);
    setImagePreview(images[0] || product.image);
    setForm({
      name: product.name,
      price: product.price,
      image: product.image,
      images,
      description: product.description,
      category: product.category,
      stock: product.stock,
      featured: product.featured,
      active: product.active,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.image || !form.description || form.stock === '') {
      toast.error('Completá todos los campos obligatorios');
      return;
    }
    setSaving(true);
    const images = form.images.length ? form.images : (form.image ? [form.image] : []);
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock), images, image: images[0] || form.image };
    try {
      if (editingProduct) {
        await productsAPI.update(editingProduct._id, payload, token);
        toast.success('Producto actualizado');
      } else {
        await productsAPI.create(payload, token);
        toast.success('Producto creado');
      }
      setModalOpen(false);
      loadProducts();
    } catch (err) {
      toast.error(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await productsAPI.delete(deleteId, token);
      toast.success('Producto eliminado');
      setDeleteId(null);
      loadProducts();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isAuthenticated) return null;

  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const outOfStock = products.filter((p) => p.stock === 0).length;

  return (
    <div className="min-h-screen bg-mate-50">
      {/* Top bar */}
      <header className="bg-mate-800 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-xl font-bold">Panel de Administración</h1>
          <p className="text-mate-300 text-sm">Bienvenido, {username}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-mate-200 hover:text-white transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total productos', value: products.length, icon: Package, color: 'text-mate-700' },
            { label: 'Stock total', value: totalStock, icon: Package, color: 'text-green-600' },
            { label: 'Sin stock', value: outOfStock, icon: AlertCircle, color: 'text-red-500' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold text-mate-900">{stat.value}</p>
                <p className="text-mate-500 text-sm">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-mate-900">Productos</h2>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-mate-800 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-mate-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo producto
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-mate-400">Cargando productos...</div>
          ) : products.length === 0 ? (
            <div className="p-16 text-center text-mate-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No hay productos. ¡Creá el primero!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-mate-50 border-b border-mate-100">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-mate-600">Producto</th>
                    <th className="text-left px-4 py-3 font-semibold text-mate-600 hidden md:table-cell">Categoría</th>
                    <th className="text-right px-4 py-3 font-semibold text-mate-600">Precio</th>
                    <th className="text-center px-4 py-3 font-semibold text-mate-600">Stock</th>
                    <th className="text-center px-4 py-3 font-semibold text-mate-600 hidden sm:table-cell">Estado</th>
                    <th className="text-right px-5 py-3 font-semibold text-mate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mate-50">
                  {products.map((p) => (
                    <tr key={p._id} className="hover:bg-mate-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-mate-100 flex-shrink-0">
                            <Image src={p.images?.[0] || p.image} alt={p.name} fill className="object-cover" sizes="40px" />
                          </div>
                          <span className="font-medium text-mate-800 line-clamp-1">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="capitalize text-mate-600">{p.category}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-mate-800">
                        ${p.price.toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold ${p.stock === 0 ? 'text-red-500' : p.stock < 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.active ? 'bg-green-100 text-green-700' : 'bg-mate-100 text-mate-500'}`}>
                          {p.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 text-mate-500 hover:text-mate-800 hover:bg-mate-100 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(p._id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-mate-100">
              <h2 className="text-xl font-bold text-mate-900">
                {editingProduct ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-mate-400 hover:text-mate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <Field label="Nombre *">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-base"
                  placeholder="Mate Calabaza Imperial"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Precio (ARS) *">
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="input-base"
                    placeholder="2500"
                  />
                </Field>
                <Field label="Stock *">
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="input-base"
                    placeholder="10"
                  />
                </Field>
              </div>

              <Field label="Categoría *">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input-base"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Imágenes *">
                <div className="space-y-3">
                  {/* Grid de imágenes cargadas */}
                  {form.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {form.images.map((url, i) => (
                        <div key={url} className="relative group">
                          <div className="relative h-24 rounded-xl overflow-hidden bg-mate-50 border-2 border-mate-200">
                            <Image src={url} alt={`Imagen ${i + 1}`} fill className="object-cover" sizes="120px" />
                            {i === 0 && (
                              <span className="absolute bottom-1 left-1 bg-mate-800 text-white text-xs px-1.5 py-0.5 rounded-full">Principal</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExtraImage(url)}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Botones de subida */}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
                  <input ref={multiFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleExtraImagesUpload} />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      disabled={uploadingImage}
                      className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-mate-300 hover:border-mate-500 rounded-xl py-2.5 text-sm text-mate-600 hover:text-mate-800 transition-colors disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      {form.images.length === 0 ? 'Subir imagen principal' : 'Cambiar principal'}
                    </button>
                    <button
                      type="button"
                      onClick={() => multiFileInputRef.current.click()}
                      disabled={uploadingImage}
                      className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-mate-300 hover:border-mate-500 rounded-xl py-2.5 text-sm text-mate-600 hover:text-mate-800 transition-colors disabled:opacity-50"
                    >
                      <ImageIcon className="w-4 h-4" />
                      {uploadingImage ? 'Subiendo...' : 'Agregar más fotos'}
                    </button>
                  </div>
                </div>
              </Field>

              <Field label="Descripción *">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-base resize-none"
                  rows={3}
                  placeholder="Describí el producto..."
                />
              </Field>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="w-4 h-4 accent-mate-700"
                  />
                  <span className="text-sm text-mate-700 font-medium">Destacado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="w-4 h-4 accent-mate-700"
                  />
                  <span className="text-sm text-mate-700 font-medium">Activo (visible)</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 border border-mate-200 text-mate-700 py-3 rounded-xl font-medium hover:bg-mate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-mate-800 text-white py-3 rounded-xl font-semibold hover:bg-mate-700 transition-colors disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : editingProduct ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <Trash2 className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-mate-900 mb-2">¿Eliminar producto?</h3>
            <p className="text-mate-500 text-sm mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-mate-200 text-mate-700 py-3 rounded-xl font-medium hover:bg-mate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input-base {
          width: 100%;
          border: 1px solid #e8c9a0;
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          color: #3d2410;
          font-size: 0.875rem;
          outline: none;
          transition: box-shadow 0.15s;
          background: white;
        }
        .input-base:focus {
          box-shadow: 0 0 0 2px #a8711f;
          border-color: #a8711f;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-mate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
