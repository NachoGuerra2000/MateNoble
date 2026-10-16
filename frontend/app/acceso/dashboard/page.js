'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Pencil, Trash2, LogOut, Package, AlertCircle, X, Upload, ImageIcon, PackagePlus, DollarSign, TrendingUp, Wallet, Receipt, Truck, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { productsAPI, transactionsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const CATEGORIES = [
  { value: 'calabaza', label: 'Calabaza' },
  { value: 'algarrobo', label: 'Algarrobo' },
  { value: 'acero', label: 'Acero' },
  { value: 'materas', label: 'Materas' },
  { value: 'bolsos', label: 'Bolsos' },
  { value: 'bombillas', label: 'Bombillas' },
  { value: 'bombillones', label: 'Bombillones' },
  { value: 'otros', label: 'Otros' },
];

const EMPTY_FORM = {
  name: '', price: '', costPrice: '', image: '', images: [], description: '',
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

  const [tab, setTab] = useState('productos');
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockForm, setRestockForm] = useState({ quantity: '', costPrice: '' });
  const [restocking, setRestocking] = useState(false);
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [financeLoading, setFinanceLoading] = useState(true);
  const [deleteTransactionId, setDeleteTransactionId] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(false);

  const [wholesaleItems, setWholesaleItems] = useState([{ productId: '', quantity: '', costPrice: '' }]);
  const [wholesaleSaving, setWholesaleSaving] = useState(false);

  // Carga y venta a mano desde Finanzas
  const [manualItems, setManualItems] = useState([]);
  const [inventorySearch, setInventorySearch] = useState('');
  const [loadForm, setLoadForm] = useState(null); // { target, name, quantity, unitCost, price }
  const [loadSaving, setLoadSaving] = useState(false);
  const [saleForm, setSaleForm] = useState(null); // { target, quantity, unitPrice }
  const [saleSaving, setSaleSaving] = useState(false);
  const [deleteManualItem, setDeleteManualItem] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) router.replace('/acceso/login');
  }, [isAuthenticated, router]);

  const handleAuthError = useCallback((err) => {
    if (err?.status === 401) {
      logout();
      toast.error('Tu sesión expiró, iniciá sesión de nuevo');
      router.replace('/acceso/login');
      return true;
    }
    return false;
  }, [logout, router]);

  const loadProducts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await productsAPI.getAllAdmin(token);
      setProducts(data);
    } catch (err) {
      if (!handleAuthError(err)) toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError]);

  const loadFinance = useCallback(async () => {
    if (!token) return;
    setFinanceLoading(true);
    try {
      const [summaryData, transactionsData, manualItemsData] = await Promise.all([
        transactionsAPI.getSummary(token),
        transactionsAPI.getAll(token),
        transactionsAPI.getManualItems(token),
      ]);
      setSummary(summaryData);
      setTransactions(transactionsData);
      setManualItems(manualItemsData);
    } catch (err) {
      if (!handleAuthError(err)) toast.error('Error al cargar las finanzas');
    } finally {
      setFinanceLoading(false);
    }
  }, [token, handleAuthError]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { if (tab === 'finanzas') loadFinance(); }, [tab, loadFinance]);

  const handleDeleteTransaction = async () => {
    if (!deleteTransactionId) return;
    setDeletingTransaction(true);
    try {
      await transactionsAPI.delete(deleteTransactionId, token);
      toast.success('Movimiento eliminado');
      setDeleteTransactionId(null);
      loadFinance();
      loadProducts();
    } catch (err) {
      if (!handleAuthError(err)) toast.error(err.message || 'Error al eliminar el movimiento');
    } finally {
      setDeletingTransaction(false);
    }
  };

  // Productos de la tienda + los cargados a mano, todos vendibles desde Finanzas
  const inventory = [
    ...products.map((p) => ({ key: `p-${p._id}`, isStore: true, id: p._id, name: p.name, stock: p.stock, costPrice: p.costPrice ?? 0, price: p.price })),
    ...manualItems.map((m) => ({ key: `m-${m._id}`, isStore: false, id: m._id, name: m.name, stock: m.stock, costPrice: m.costPrice, price: m.price })),
  ];
  const targetRef = (target) => (target.isStore ? { productId: target.id } : { manualItemId: target.id });

  const openLoad = (target = null) => {
    setLoadForm({
      targetKey: target?.key || '',
      name: '',
      quantity: '',
      unitCost: target ? String(target.costPrice) : '',
      price: target ? String(target.price) : '',
    });
  };

  const handleLoadTargetChange = (targetKey) => {
    const target = inventory.find((i) => i.key === targetKey);
    setLoadForm((prev) => ({
      ...prev,
      targetKey,
      unitCost: target ? String(target.costPrice) : '',
      price: target ? String(target.price) : '',
    }));
  };

  const handleLoadSubmit = async (e) => {
    e.preventDefault();
    const target = inventory.find((i) => i.key === loadForm.targetKey);
    const qty = Number(loadForm.quantity);
    if (!target && !loadForm.name.trim()) {
      toast.error('Poné el nombre del producto');
      return;
    }
    if (!qty || qty <= 0) {
      toast.error('Ingresá una cantidad válida');
      return;
    }
    if (loadForm.unitCost === '' || (!target && loadForm.price === '')) {
      toast.error('Completá cuánto te salió y a cuánto lo vendés');
      return;
    }
    setLoadSaving(true);
    try {
      await transactionsAPI.purchase(
        {
          ...(target ? targetRef(target) : { name: loadForm.name.trim() }),
          quantity: qty,
          unitCost: Number(loadForm.unitCost),
          price: loadForm.price === '' ? undefined : Number(loadForm.price),
        },
        token
      );
      toast.success('Carga registrada');
      setLoadForm(null);
      loadFinance();
      loadProducts();
    } catch (err) {
      if (!handleAuthError(err)) toast.error(err.message || 'Error al cargar');
    } finally {
      setLoadSaving(false);
    }
  };

  const openSale = (target) => {
    setSaleForm({ target, quantity: '1', unitPrice: String(target.price) });
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    const qty = Number(saleForm.quantity);
    if (!qty || qty <= 0) {
      toast.error('Ingresá una cantidad válida');
      return;
    }
    if (qty > saleForm.target.stock) {
      toast.error(`Solo quedan ${saleForm.target.stock} en stock`);
      return;
    }
    setSaleSaving(true);
    try {
      await transactionsAPI.sale(
        {
          ...targetRef(saleForm.target),
          quantity: qty,
          unitPrice: saleForm.unitPrice === '' ? undefined : Number(saleForm.unitPrice),
        },
        token
      );
      toast.success('Venta registrada');
      setSaleForm(null);
      loadFinance();
      loadProducts();
    } catch (err) {
      if (!handleAuthError(err)) toast.error(err.message || 'Error al registrar la venta');
    } finally {
      setSaleSaving(false);
    }
  };

  const handleDeleteManualItem = async () => {
    if (!deleteManualItem) return;
    try {
      await transactionsAPI.deleteManualItem(deleteManualItem.id, token);
      toast.success('Producto eliminado');
      setDeleteManualItem(null);
      loadFinance();
    } catch (err) {
      if (!handleAuthError(err)) toast.error(err.message || 'Error al eliminar');
    }
  };

  const openRestock = (product) => {
    setRestockProduct(product);
    setRestockForm({ quantity: '', costPrice: product.costPrice ?? '' });
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    const qty = Number(restockForm.quantity);
    if (!qty || qty <= 0) {
      toast.error('Ingresá una cantidad válida');
      return;
    }
    setRestocking(true);
    try {
      await productsAPI.restock(
        restockProduct._id,
        { quantity: qty, costPrice: restockForm.costPrice === '' ? undefined : Number(restockForm.costPrice) },
        token
      );
      toast.success('Stock repuesto');
      setRestockProduct(null);
      loadProducts();
    } catch (err) {
      if (!handleAuthError(err)) toast.error(err.message || 'Error al reponer stock');
    } finally {
      setRestocking(false);
    }
  };

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
      costPrice: product.costPrice ?? '',
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
    if (!form.name || !form.price || form.costPrice === '' || !form.image || !form.description || form.stock === '') {
      toast.error('Completá todos los campos obligatorios');
      return;
    }
    setSaving(true);
    const images = form.images.length ? form.images : (form.image ? [form.image] : []);
    const payload = { ...form, price: Number(form.price), costPrice: Number(form.costPrice), stock: Number(form.stock), images, image: images[0] || form.image };
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
      if (!handleAuthError(err)) toast.error(err.message || 'Error al guardar');
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
    } catch (err) {
      if (!handleAuthError(err)) toast.error('Error al eliminar');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const addWholesaleRow = () => {
    setWholesaleItems((prev) => [...prev, { productId: '', quantity: '', costPrice: '' }]);
  };

  const removeWholesaleRow = (index) => {
    setWholesaleItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateWholesaleRow = (index, field, value) => {
    setWholesaleItems((prev) => prev.map((row, i) => {
      if (i !== index) return row;
      const updated = { ...row, [field]: value };
      if (field === 'productId' && updated.costPrice === '') {
        const product = products.find((p) => p._id === value);
        if (product) updated.costPrice = String(product.costPrice);
      }
      return updated;
    }));
  };

  const wholesaleTotal = wholesaleItems.reduce((sum, row) => {
    const product = products.find((p) => p._id === row.productId);
    const cost = row.costPrice !== '' ? Number(row.costPrice) : (product?.costPrice || 0);
    return sum + (Number(row.quantity) || 0) * cost;
  }, 0);

  const handleWholesaleSubmit = async () => {
    const items = wholesaleItems.filter((r) => r.productId && Number(r.quantity) > 0);
    if (!items.length) {
      toast.error('Agregá al menos un producto con cantidad válida');
      return;
    }
    setWholesaleSaving(true);
    try {
      await productsAPI.bulkRestock(
        items.map((r) => ({
          productId: r.productId,
          quantity: Number(r.quantity),
          costPrice: r.costPrice === '' ? undefined : Number(r.costPrice),
        })),
        token
      );
      toast.success('Compra mayorista registrada');
      setWholesaleItems([{ productId: '', quantity: '', costPrice: '' }]);
      loadProducts();
    } catch (err) {
      if (!handleAuthError(err)) toast.error(err.message || 'Error al registrar la compra');
    } finally {
      setWholesaleSaving(false);
    }
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
        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white rounded-xl p-1.5 shadow-sm w-fit">
          <button
            onClick={() => setTab('productos')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'productos' ? 'bg-mate-800 text-white' : 'text-mate-600 hover:bg-mate-50'}`}
          >
            Productos
          </button>
          <button
            onClick={() => setTab('finanzas')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'finanzas' ? 'bg-mate-800 text-white' : 'text-mate-600 hover:bg-mate-50'}`}
          >
            Finanzas
          </button>
          <button
            onClick={() => setTab('mayorista')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'mayorista' ? 'bg-mate-800 text-white' : 'text-mate-600 hover:bg-mate-50'}`}
          >
            Compra mayorista
          </button>
        </div>

        {tab === 'productos' && (
        <>
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
                            onClick={() => openRestock(p)}
                            className={`p-1.5 rounded-lg transition-colors ${p.stock === 0 ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-mate-500 hover:text-mate-800 hover:bg-mate-100'}`}
                            title="Reponer stock"
                          >
                            <PackagePlus className="w-4 h-4" />
                          </button>
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
        </>
        )}

        {tab === 'finanzas' && (
        <>
        {financeLoading ? (
          <div className="p-16 text-center text-mate-400">Cargando finanzas...</div>
        ) : (
        <>
        {/* Finance stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Invertido total', value: summary?.totalInvested ?? 0, icon: Wallet, color: 'text-mate-700' },
            { label: 'Ingresos por ventas', value: summary?.totalRevenue ?? 0, icon: DollarSign, color: 'text-blue-600' },
            { label: 'Costo de lo vendido', value: summary?.totalCost ?? 0, icon: Receipt, color: 'text-mate-500' },
            { label: 'Ganancia', value: summary?.totalProfit ?? 0, icon: TrendingUp, color: 'text-green-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4">
              <stat.icon className={`w-8 h-8 flex-shrink-0 ${stat.color}`} />
              <div>
                <p className="text-xl font-bold text-mate-900">${stat.value.toLocaleString('es-AR')}</p>
                <p className="text-mate-500 text-sm">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Inventory: manual load & sale */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-mate-900">Inventario y ventas a mano</h2>
            <p className="text-mate-500 text-sm">Cargá lo que compraste y registrá lo que vendés por fuera de la página.</p>
          </div>
          <button
            onClick={() => openLoad()}
            className="flex items-center justify-center gap-2 bg-mate-800 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-mate-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Cargar producto
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
          {inventory.length > 6 && (
            <div className="p-3 border-b border-mate-100">
              <input
                type="text"
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="input-base"
                placeholder="Buscar producto..."
              />
            </div>
          )}
          {!inventory.length ? (
            <div className="p-10 text-center text-mate-400">Todavía no cargaste productos.</div>
          ) : (
            <div className="overflow-x-auto max-h-[32rem] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-mate-50 border-b border-mate-100 sticky top-0">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-mate-600">Producto</th>
                    <th className="text-center px-4 py-3 font-semibold text-mate-600">Stock</th>
                    <th className="text-right px-4 py-3 font-semibold text-mate-600">Me salió</th>
                    <th className="text-right px-4 py-3 font-semibold text-mate-600">Lo vendo a</th>
                    <th className="text-right px-4 py-3 font-semibold text-mate-600 hidden sm:table-cell">Gano c/u</th>
                    <th className="text-right px-5 py-3 font-semibold text-mate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mate-50">
                  {inventory
                    .filter((i) => i.name.toLowerCase().includes(inventorySearch.trim().toLowerCase()))
                    .map((i) => {
                      const margin = i.price - i.costPrice;
                      return (
                        <tr key={i.key} className="hover:bg-mate-50/50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="font-medium text-mate-800">{i.name}</div>
                            <span className={`text-xs ${i.isStore ? 'text-mate-400' : 'text-amber-600'}`}>
                              {i.isStore ? 'En la tienda' : 'Solo en finanzas'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-semibold ${i.stock === 0 ? 'text-red-500' : i.stock < 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {i.stock}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-mate-600">${i.costPrice.toLocaleString('es-AR')}</td>
                          <td className="px-4 py-3 text-right font-semibold text-mate-800">${i.price.toLocaleString('es-AR')}</td>
                          <td className={`px-4 py-3 text-right hidden sm:table-cell ${margin >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            ${margin.toLocaleString('es-AR')}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openSale(i)}
                                disabled={i.stock === 0}
                                className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                title={i.stock === 0 ? 'Sin stock' : 'Registrar venta'}
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                Vender
                              </button>
                              <button
                                onClick={() => openLoad(i)}
                                className="p-1.5 text-mate-500 hover:text-mate-800 hover:bg-mate-100 rounded-lg transition-colors"
                                title="Cargar stock"
                              >
                                <PackagePlus className="w-4 h-4" />
                              </button>
                              {!i.isStore && (
                                <button
                                  onClick={() => setDeleteManualItem(i)}
                                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Eliminar producto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Per-product breakdown */}
        <h2 className="text-xl font-bold text-mate-900 mb-4">Ganancia por producto</h2>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
          {!summary?.products?.length ? (
            <div className="p-10 text-center text-mate-400">Todavía no hay movimientos.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-mate-50 border-b border-mate-100">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-mate-600">Producto</th>
                    <th className="text-right px-4 py-3 font-semibold text-mate-600">Invertido</th>
                    <th className="text-center px-4 py-3 font-semibold text-mate-600">Vendidos</th>
                    <th className="text-right px-4 py-3 font-semibold text-mate-600">Ingresos</th>
                    <th className="text-right px-5 py-3 font-semibold text-mate-600">Ganancia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mate-50">
                  {summary.products.map((p) => (
                    <tr key={p.productName} className="hover:bg-mate-50/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-mate-800">{p.productName}</td>
                      <td className="px-4 py-3 text-right text-mate-600">${p.invested.toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3 text-center text-mate-600">{p.unitsSold}</td>
                      <td className="px-4 py-3 text-right text-mate-600">${p.revenue.toLocaleString('es-AR')}</td>
                      <td className={`px-5 py-3 text-right font-semibold ${p.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        ${p.profit.toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Transaction ledger */}
        <h2 className="text-xl font-bold text-mate-900 mb-4">Movimientos</h2>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {!transactions.length ? (
            <div className="p-10 text-center text-mate-400">Todavía no hay movimientos.</div>
          ) : (
            <div className="overflow-x-auto max-h-[28rem] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-mate-50 border-b border-mate-100 sticky top-0">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-mate-600">Fecha</th>
                    <th className="text-left px-4 py-3 font-semibold text-mate-600">Tipo</th>
                    <th className="text-left px-4 py-3 font-semibold text-mate-600">Producto</th>
                    <th className="text-center px-4 py-3 font-semibold text-mate-600">Cant.</th>
                    <th className="text-right px-4 py-3 font-semibold text-mate-600">Monto</th>
                    <th className="text-right px-5 py-3 font-semibold text-mate-600"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mate-50">
                  {transactions.map((t) => (
                    <tr key={t._id} className="hover:bg-mate-50/50 transition-colors">
                      <td className="px-5 py-3 text-mate-500 whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.type === 'compra' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                          {t.type === 'compra' ? 'Compra' : 'Venta'}
                        </span>
                        {t.type === 'venta' && (
                          <span className="ml-1.5 text-xs text-mate-400">{t.orderId ? 'web' : 'a mano'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-mate-800">{t.productName}</td>
                      <td className="px-4 py-3 text-center text-mate-600">{t.quantity}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${t.type === 'compra' ? 'text-amber-700' : 'text-green-700'}`}>
                        {t.type === 'compra' ? '-' : '+'}${t.total.toLocaleString('es-AR')}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setDeleteTransactionId(t._id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Borrar movimiento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
        )}
        </>
        )}

        {tab === 'mayorista' && (
          <div className="max-w-3xl">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-1">
                <Truck className="w-6 h-6 text-mate-700" />
                <h2 className="text-xl font-bold text-mate-900">Compra mayorista</h2>
              </div>
              <p className="text-mate-500 text-sm mb-6">
                Cargá de una sola vez el stock de varios productos cuando llega un pedido al proveedor.
              </p>

              <div className="space-y-3">
                {wholesaleItems.map((row, i) => {
                  const product = products.find((p) => p._id === row.productId);
                  const cost = row.costPrice !== '' ? Number(row.costPrice) : (product?.costPrice || 0);
                  const subtotal = (Number(row.quantity) || 0) * cost;
                  return (
                    <div key={i} className="flex flex-col sm:flex-row gap-2 sm:items-end border border-mate-100 rounded-xl p-3">
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-medium text-mate-600 mb-1">Producto</label>
                        <select
                          value={row.productId}
                          onChange={(e) => updateWholesaleRow(i, 'productId', e.target.value)}
                          className="input-base"
                        >
                          <option value="">Seleccionar...</option>
                          {products.map((p) => (
                            <option key={p._id} value={p._id}>{p.name} (stock: {p.stock})</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-full sm:w-28">
                        <label className="block text-xs font-medium text-mate-600 mb-1">Cantidad</label>
                        <input
                          type="number"
                          min="1"
                          value={row.quantity}
                          onChange={(e) => updateWholesaleRow(i, 'quantity', e.target.value)}
                          className="input-base"
                          placeholder="10"
                        />
                      </div>
                      <div className="w-full sm:w-36">
                        <label className="block text-xs font-medium text-mate-600 mb-1">Costo unitario</label>
                        <input
                          type="number"
                          min="0"
                          value={row.costPrice}
                          onChange={(e) => updateWholesaleRow(i, 'costPrice', e.target.value)}
                          className="input-base"
                          placeholder={product ? String(product.costPrice) : '0'}
                        />
                      </div>
                      <div className="w-full sm:w-28 flex items-center justify-between sm:block">
                        <span className="text-xs text-mate-500 sm:hidden">Subtotal</span>
                        <span className="text-sm font-semibold text-mate-700">${subtotal.toLocaleString('es-AR')}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeWholesaleRow(i)}
                        disabled={wholesaleItems.length === 1}
                        className="self-end sm:self-auto p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Quitar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={addWholesaleRow}
                className="mt-4 flex items-center gap-2 text-sm font-medium text-mate-700 hover:text-mate-900"
              >
                <Plus className="w-4 h-4" />
                Agregar producto
              </button>

              <div className="border-t border-mate-100 mt-6 pt-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-mate-500">Total de la compra</p>
                  <p className="text-2xl font-bold text-mate-900">${wholesaleTotal.toLocaleString('es-AR')}</p>
                </div>
                <button
                  type="button"
                  onClick={handleWholesaleSubmit}
                  disabled={wholesaleSaving}
                  className="bg-mate-800 text-white px-6 py-3 rounded-xl font-semibold hover:bg-mate-700 transition-colors disabled:opacity-60"
                >
                  {wholesaleSaving ? 'Cargando...' : 'Registrar compra'}
                </button>
              </div>
            </div>
          </div>
        )}
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
                <Field label="Precio de compra (ARS) *">
                  <input
                    type="number"
                    min="0"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    className="input-base"
                    placeholder="1500"
                  />
                </Field>
                <Field label="Precio de venta (ARS) *">
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="input-base"
                    placeholder="2500"
                  />
                </Field>
              </div>

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

      {/* Delete transaction confirm modal */}
      {deleteTransactionId && (() => {
        const t = transactions.find((tx) => tx._id === deleteTransactionId);
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
              <Trash2 className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-mate-900 mb-2">¿Borrar este movimiento?</h3>
              {t && (
                <p className="text-mate-600 text-sm mb-1">
                  {t.type === 'compra' ? 'Compra' : 'Venta'} de {t.quantity} — {t.productName}
                </p>
              )}
              <p className="text-mate-500 text-sm mb-6">
                Se va a sacar de la caja y {t?.type === 'compra' ? 'se le va a restar el stock que había sumado' : 'se le va a devolver el stock al producto'}.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTransactionId(null)}
                  className="flex-1 border border-mate-200 text-mate-700 py-3 rounded-xl font-medium hover:bg-mate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteTransaction}
                  disabled={deletingTransaction}
                  className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
                >
                  {deletingTransaction ? 'Borrando...' : 'Borrar'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Manual load modal */}
      {loadForm && (() => {
        const target = inventory.find((i) => i.key === loadForm.targetKey);
        const total = (Number(loadForm.quantity) || 0) * (Number(loadForm.unitCost) || 0);
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-mate-900">Cargar producto</h3>
                <button onClick={() => setLoadForm(null)} className="text-mate-400 hover:text-mate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleLoadSubmit} className="space-y-4">
                <Field label="Producto">
                  <select
                    value={loadForm.targetKey}
                    onChange={(e) => handleLoadTargetChange(e.target.value)}
                    className="input-base"
                  >
                    <option value="">+ Producto nuevo (solo en finanzas)</option>
                    {inventory.map((i) => (
                      <option key={i.key} value={i.key}>{i.name} (stock: {i.stock})</option>
                    ))}
                  </select>
                </Field>
                {!target && (
                  <Field label="Nombre *">
                    <input
                      type="text"
                      autoFocus
                      value={loadForm.name}
                      onChange={(e) => setLoadForm({ ...loadForm, name: e.target.value })}
                      className="input-base"
                      placeholder="Bombilla de alpaca"
                    />
                  </Field>
                )}
                <Field label="Cantidad *">
                  <input
                    type="number"
                    min="1"
                    autoFocus={!!target}
                    value={loadForm.quantity}
                    onChange={(e) => setLoadForm({ ...loadForm, quantity: e.target.value })}
                    className="input-base"
                    placeholder="5"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Me salió c/u (ARS) *">
                    <input
                      type="number"
                      min="0"
                      value={loadForm.unitCost}
                      onChange={(e) => setLoadForm({ ...loadForm, unitCost: e.target.value })}
                      className="input-base"
                      placeholder="1500"
                    />
                  </Field>
                  <Field label={`Lo vendo a (ARS)${target ? '' : ' *'}`}>
                    <input
                      type="number"
                      min="0"
                      value={loadForm.price}
                      onChange={(e) => setLoadForm({ ...loadForm, price: e.target.value })}
                      className="input-base"
                      placeholder="2500"
                    />
                  </Field>
                </div>
                {target?.isStore && (
                  <p className="text-xs text-mate-400 -mt-2">Es un producto de la tienda: el precio nuevo también se actualiza en la página.</p>
                )}
                <p className="text-sm text-mate-600">Total invertido: <span className="font-semibold">${total.toLocaleString('es-AR')}</span></p>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setLoadForm(null)}
                    className="flex-1 border border-mate-200 text-mate-700 py-3 rounded-xl font-medium hover:bg-mate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loadSaving}
                    className="flex-1 bg-mate-800 text-white py-3 rounded-xl font-semibold hover:bg-mate-700 transition-colors disabled:opacity-60"
                  >
                    {loadSaving ? 'Guardando...' : 'Cargar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Manual sale modal */}
      {saleForm && (() => {
        const qty = Number(saleForm.quantity) || 0;
        const unitPrice = saleForm.unitPrice === '' ? saleForm.target.price : Number(saleForm.unitPrice) || 0;
        const total = qty * unitPrice;
        const profit = total - qty * saleForm.target.costPrice;
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-mate-900">Registrar venta</h3>
                <button onClick={() => setSaleForm(null)} className="text-mate-400 hover:text-mate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-mate-500 text-sm mb-5">{saleForm.target.name}</p>

              <form onSubmit={handleSaleSubmit} className="space-y-4">
                <Field label="Cantidad vendida *">
                  <input
                    type="number"
                    min="1"
                    max={saleForm.target.stock}
                    autoFocus
                    value={saleForm.quantity}
                    onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })}
                    className="input-base"
                  />
                </Field>
                <Field label="Precio de venta c/u (ARS)">
                  <input
                    type="number"
                    min="0"
                    value={saleForm.unitPrice}
                    onChange={(e) => setSaleForm({ ...saleForm, unitPrice: e.target.value })}
                    className="input-base"
                    placeholder={String(saleForm.target.price)}
                  />
                </Field>
                <p className="text-xs text-mate-400 -mt-2">Stock disponible: {saleForm.target.stock}</p>
                <div className="bg-mate-50 rounded-xl p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-mate-500">Cobrás</span><span className="font-semibold text-mate-800">${total.toLocaleString('es-AR')}</span></div>
                  <div className="flex justify-between"><span className="text-mate-500">Ganancia</span><span className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>${profit.toLocaleString('es-AR')}</span></div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setSaleForm(null)}
                    className="flex-1 border border-mate-200 text-mate-700 py-3 rounded-xl font-medium hover:bg-mate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saleSaving}
                    className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
                  >
                    {saleSaving ? 'Guardando...' : 'Vender'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Delete manual item confirm modal */}
      {deleteManualItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <Trash2 className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-mate-900 mb-2">¿Eliminar &quot;{deleteManualItem.name}&quot;?</h3>
            <p className="text-mate-500 text-sm mb-6">Sale del inventario. Las compras y ventas que ya registraste quedan en el historial.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteManualItem(null)}
                className="flex-1 border border-mate-200 text-mate-700 py-3 rounded-xl font-medium hover:bg-mate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteManualItem}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restock modal */}
      {restockProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-mate-900">Reponer stock</h3>
              <button onClick={() => setRestockProduct(null)} className="text-mate-400 hover:text-mate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-mate-500 text-sm mb-5">{restockProduct.name}</p>

            <form onSubmit={handleRestock} className="space-y-4">
              <Field label="Cantidad que agregás *">
                <input
                  type="number"
                  min="1"
                  autoFocus
                  value={restockForm.quantity}
                  onChange={(e) => setRestockForm({ ...restockForm, quantity: e.target.value })}
                  className="input-base"
                  placeholder="5"
                />
              </Field>
              <Field label="Precio de compra actual (ARS)">
                <input
                  type="number"
                  min="0"
                  value={restockForm.costPrice}
                  onChange={(e) => setRestockForm({ ...restockForm, costPrice: e.target.value })}
                  className="input-base"
                  placeholder={String(restockProduct.costPrice ?? 0)}
                />
              </Field>
              <p className="text-xs text-mate-400 -mt-2">Stock actual: {restockProduct.stock}</p>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="flex-1 border border-mate-200 text-mate-700 py-3 rounded-xl font-medium hover:bg-mate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={restocking}
                  className="flex-1 bg-mate-800 text-white py-3 rounded-xl font-semibold hover:bg-mate-700 transition-colors disabled:opacity-60"
                >
                  {restocking ? 'Guardando...' : 'Reponer'}
                </button>
              </div>
            </form>
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
