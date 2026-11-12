'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Copy, ClipboardList, Wallet, PiggyBank, TrendingUp } from 'lucide-react';
import { encargosAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const CLIENT_TYPES = [
  { value: 'empresa', label: 'Empresa' },
  { value: 'comercio', label: 'Comercio' },
  { value: 'club', label: 'Club' },
  { value: 'egresados', label: 'Egresados' },
  { value: 'particular', label: 'Particular' },
  { value: 'otro', label: 'Otro' },
];

const STATUSES = [
  { value: 'cotizado', label: 'Cotizado', color: 'bg-slate-100 text-slate-700' },
  { value: 'senado', label: 'Señado', color: 'bg-amber-100 text-amber-700' },
  { value: 'comprado', label: 'Comprado al mayorista', color: 'bg-blue-100 text-blue-700' },
  { value: 'entregado', label: 'Entregado', color: 'bg-green-100 text-green-700' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-600' },
];
const STATUS_BY_VALUE = Object.fromEntries(STATUSES.map((s) => [s.value, s]));
const OPEN = ['cotizado', 'senado', 'comprado'];

const money = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-AR')}`;
const EMPTY_ITEM = { description: '', quantity: '', unitPrice: '', unitCost: '' };
const EMPTY_FORM = {
  client: { name: '', type: 'empresa', contact: '' },
  items: [{ ...EMPTY_ITEM }],
  depositPercent: '50',
  depositPaid: '',
  status: 'cotizado',
  dueDate: '',
  notes: '',
};

const calc = (form) => {
  const total = form.items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
  const cost = form.items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitCost) || 0), 0);
  const deposit = Math.round((total * (Number(form.depositPercent) || 0)) / 100);
  return { total, cost, deposit, profit: total - cost };
};

// Texto del presupuesto listo para pegar en WhatsApp
const buildQuote = (e) => {
  const lines = e.items.map((i) => `• ${i.quantity} x ${i.description} — ${money(i.unitPrice)} c/u = ${money(i.quantity * i.unitPrice)}`);
  const deposit = e.depositSuggested ?? Math.round((e.total * e.depositPercent) / 100);
  const due = e.dueDate ? `\nEntrega estimada: ${new Date(e.dueDate).toLocaleDateString('es-AR', { timeZone: 'UTC' })}` : '';
  return [
    `¡Hola${e.client.name ? ` ${e.client.name}` : ''}! 🧉 Te paso el presupuesto de Mate Noble:`,
    '',
    ...lines,
    '',
    `*Total: ${money(e.total)}*`,
    `Para confirmar el pedido pedimos una seña del ${e.depositPercent}% (${money(deposit)}) y el resto (${money(e.total - deposit)}) contra entrega.${due}`,
    '',
    'Cualquier duda nos escribís. ¡Gracias!',
  ].join('\n');
};

export default function EncargosTab({ token, onAuthError, onSalesChanged, products = [] }) {
  const [encargos, setEncargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null); // null = cerrado
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setEncargos(await encargosAPI.getAll(token));
    } catch (err) {
      if (!onAuthError(err)) toast.error('Error al cargar los encargos');
    } finally {
      setLoading(false);
    }
  }, [token, onAuthError]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditingId(null); setForm(structuredClone(EMPTY_FORM)); };
  const openEdit = (e) => {
    setEditingId(e._id);
    setForm({
      client: { ...e.client },
      items: e.items.map((i) => ({ description: i.description, quantity: String(i.quantity), unitPrice: String(i.unitPrice), unitCost: String(i.unitCost || '') })),
      depositPercent: String(e.depositPercent),
      depositPaid: e.depositPaid ? String(e.depositPaid) : '',
      status: e.status,
      dueDate: e.dueDate ? e.dueDate.slice(0, 10) : '',
      notes: e.notes || '',
    });
  };

  // Agrega un producto del catálogo con el precio para empresas (o el de la tienda) y su costo
  const addFromCatalog = (productId) => {
    const p = products.find((x) => x._id === productId);
    if (!p) return;
    const item = {
      description: p.name,
      quantity: '',
      unitPrice: String(p.wholesalePrice > 0 ? p.wholesalePrice : p.price),
      unitCost: String(p.costPrice || ''),
    };
    const onlyEmpty = form.items.length === 1 && !form.items[0].description && !form.items[0].quantity && !form.items[0].unitPrice;
    setForm({ ...form, items: onlyEmpty ? [item] : [...form.items, item] });
  };

  const setItem = (idx, field, value) =>
    setForm({ ...form, items: form.items.map((it, i) => (i === idx ? { ...it, [field]: value } : it)) });

  const save = async (data, id) => {
    const result = id ? await encargosAPI.update(id, data, token) : await encargosAPI.create(data, token);
    await load();
    onSalesChanged?.();
    return result;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!form.client.name.trim()) return toast.error('Poné el nombre del cliente');
    const items = form.items.filter((i) => i.description.trim() || i.quantity || i.unitPrice);
    if (!items.length) return toast.error('Agregá al menos un producto');
    if (items.some((i) => !i.description.trim() || !(Number(i.quantity) > 0) || i.unitPrice === '')) {
      return toast.error('Cada producto necesita descripción, cantidad y precio');
    }
    setSaving(true);
    try {
      await save({ ...form, items, depositPaid: Number(form.depositPaid) || 0 }, editingId);
      toast.success(editingId ? 'Encargo actualizado' : 'Encargo creado');
      setForm(null);
    } catch (err) {
      if (!onAuthError(err)) toast.error(err.message || 'Error al guardar el encargo');
    } finally {
      setSaving(false);
    }
  };

  // Cambio rápido de estado desde la lista. Al pasar a "Señado" sin seña cargada, se carga la sugerida.
  const changeStatus = async (e, status) => {
    const data = { status };
    if (status === 'senado' && !e.depositPaid) data.depositPaid = e.depositSuggested;
    try {
      await save(data, e._id);
      toast.success(status === 'entregado' ? 'Entregado: la venta quedó registrada en Finanzas' : `Estado: ${STATUS_BY_VALUE[status].label}`);
    } catch (err) {
      if (!onAuthError(err)) toast.error(err.message || 'Error al cambiar el estado');
    }
  };

  const copyQuote = async (e) => {
    try {
      await navigator.clipboard.writeText(buildQuote(e));
      toast.success('Presupuesto copiado: pegalo en WhatsApp');
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const handleDelete = async () => {
    try {
      await encargosAPI.delete(deleteTarget._id, token);
      toast.success('Encargo eliminado');
      setDeleteTarget(null);
      await load();
      onSalesChanged?.();
    } catch (err) {
      if (!onAuthError(err)) toast.error(err.message || 'Error al eliminar');
    }
  };

  const open = encargos.filter((e) => OPEN.includes(e.status));
  const stats = [
    { label: 'Encargos abiertos', value: open.length, icon: ClipboardList, isMoney: false },
    { label: 'Señas cobradas (abiertos)', value: open.reduce((s, e) => s + e.depositPaid, 0), icon: PiggyBank },
    { label: 'Saldo a cobrar', value: open.reduce((s, e) => s + e.balance, 0), icon: Wallet },
    { label: 'Ganancia de entregados', value: encargos.filter((e) => e.status === 'entregado').reduce((s, e) => s + e.total - e.totalCost, 0), icon: TrendingUp },
  ];

  const totals = form ? calc(form) : null;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4">
            <s.icon className="w-8 h-8 flex-shrink-0 text-mate-700" />
            <div>
              <p className="text-xl font-bold text-mate-900">{s.isMoney === false ? s.value : money(s.value)}</p>
              <p className="text-mate-500 text-sm">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-mate-900">Encargos y ventas grandes</h2>
          <p className="text-mate-500 text-sm">Empresas, clubes, egresados y comercios: cotizá, cobrá la seña, comprá al mayorista y entregá. Al marcarlo como entregado, la venta pasa a Finanzas.</p>
        </div>
        <button onClick={openNew} className="flex items-center justify-center gap-2 bg-mate-800 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-mate-700 transition-colors whitespace-nowrap">
          <Plus className="w-4 h-4" /> Nuevo encargo
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
        {loading ? (
          <div className="p-10 text-center text-mate-400">Cargando encargos...</div>
        ) : !encargos.length ? (
          <div className="p-10 text-center text-mate-400">Todavía no hay encargos. Creá el primero con &quot;Nuevo encargo&quot;.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-mate-50 border-b border-mate-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-mate-600">Cliente</th>
                  <th className="text-left px-4 py-3 font-semibold text-mate-600 hidden md:table-cell">Detalle</th>
                  <th className="text-right px-4 py-3 font-semibold text-mate-600">Total</th>
                  <th className="text-right px-4 py-3 font-semibold text-mate-600 hidden sm:table-cell">Seña</th>
                  <th className="text-right px-4 py-3 font-semibold text-mate-600 hidden sm:table-cell">Saldo</th>
                  <th className="text-left px-4 py-3 font-semibold text-mate-600">Estado</th>
                  <th className="text-right px-5 py-3 font-semibold text-mate-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mate-50">
                {encargos.map((e) => (
                  <tr key={e._id} className="hover:bg-mate-50/50 transition-colors align-top">
                    <td className="px-5 py-3">
                      <p className="font-medium text-mate-800">{e.client.name}</p>
                      <p className="text-xs text-mate-400">
                        {CLIENT_TYPES.find((t) => t.value === e.client.type)?.label}
                        {e.client.contact ? ` · ${e.client.contact}` : ''}
                      </p>
                      {e.dueDate && (
                        <p className="text-xs text-mate-500 mt-0.5">Entrega: {new Date(e.dueDate).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-mate-600 hidden md:table-cell">
                      {e.items.map((i) => `${i.quantity} x ${i.description}`).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-mate-800">{money(e.total)}</td>
                    <td className="px-4 py-3 text-right text-mate-600 hidden sm:table-cell">
                      {money(e.depositPaid)}
                      {!e.depositPaid && OPEN.includes(e.status) && (
                        <p className="text-xs text-mate-400">sugerida {money(e.depositSuggested)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-mate-600 hidden sm:table-cell">{money(e.balance)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={e.status}
                        onChange={(ev) => changeStatus(e, ev.target.value)}
                        className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer ${STATUS_BY_VALUE[e.status]?.color}`}
                      >
                        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => copyQuote(e)} className="p-1.5 text-mate-500 hover:text-mate-800 hover:bg-mate-100 rounded-lg transition-colors" title="Copiar presupuesto para WhatsApp">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(e)} className="p-1.5 text-mate-500 hover:text-mate-800 hover:bg-mate-100 rounded-lg transition-colors" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(e)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
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

      {/* Modal crear / editar */}
      {form && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-mate-900">{editingId ? 'Editar encargo' : 'Nuevo encargo'}</h3>
              <button onClick={() => setForm(null)} className="text-mate-400 hover:text-mate-700"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Cliente *">
                  <input className="input-base" value={form.client.name} autoFocus placeholder="Club Atlético..."
                    onChange={(e) => setForm({ ...form, client: { ...form.client, name: e.target.value } })} />
                </Field>
                <Field label="Tipo">
                  <select className="input-base" value={form.client.type}
                    onChange={(e) => setForm({ ...form, client: { ...form.client, type: e.target.value } })}>
                    {CLIENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
                <Field label="Contacto">
                  <input className="input-base" value={form.client.contact} placeholder="Nombre / teléfono"
                    onChange={(e) => setForm({ ...form, client: { ...form.client, contact: e.target.value } })} />
                </Field>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                  <p className="block text-sm font-medium text-mate-700">Productos</p>
                  {products.length > 0 && (
                    <select
                      className="input-base sm:!w-64 !py-1.5 !text-sm"
                      value=""
                      onChange={(e) => addFromCatalog(e.target.value)}
                    >
                      <option value="">+ Agregar del catálogo...</option>
                      {[...products].sort((a, b) => (b.wholesalePrice > 0) - (a.wholesalePrice > 0) || a.name.localeCompare(b.name)).map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} — {money(p.wholesalePrice > 0 ? p.wholesalePrice : p.price)}{p.wholesalePrice > 0 ? ' (empresas)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="hidden sm:grid grid-cols-12 gap-2 text-xs text-mate-500 px-1">
                    <span className="col-span-5">Descripción</span><span className="col-span-2">Cantidad</span>
                    <span className="col-span-2">Precio c/u</span><span className="col-span-2">Costo c/u</span>
                  </div>
                  {form.items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <input className="input-base col-span-12 sm:col-span-5" placeholder="Mate calabaza grabado" value={it.description}
                        onChange={(e) => setItem(idx, 'description', e.target.value)} />
                      <input className="input-base col-span-4 sm:col-span-2" type="number" min="1" placeholder="Cant." value={it.quantity}
                        onChange={(e) => setItem(idx, 'quantity', e.target.value)} />
                      <input className="input-base col-span-4 sm:col-span-2" type="number" min="0" placeholder="Precio" value={it.unitPrice}
                        onChange={(e) => setItem(idx, 'unitPrice', e.target.value)} />
                      <input className="input-base col-span-3 sm:col-span-2" type="number" min="0" placeholder="Costo" value={it.unitCost}
                        onChange={(e) => setItem(idx, 'unitCost', e.target.value)} />
                      <button type="button" disabled={form.items.length === 1}
                        onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })}
                        className="col-span-1 p-1.5 text-red-400 hover:text-red-600 disabled:opacity-30" title="Quitar">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setForm({ ...form, items: [...form.items, { ...EMPTY_ITEM }] })}
                  className="mt-2 text-sm text-mate-700 font-medium hover:underline">+ Agregar producto</button>
                <p className="text-xs text-mate-400 mt-1">El costo es lo que te sale a vos (por ejemplo, lo que le pagás al mayorista). Sirve para calcular la ganancia.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Seña (%)">
                  <input className="input-base" type="number" min="0" max="100" value={form.depositPercent}
                    onChange={(e) => setForm({ ...form, depositPercent: e.target.value })} />
                </Field>
                <Field label="Seña cobrada (ARS)">
                  <div className="flex gap-2">
                    <input className="input-base" type="number" min="0" value={form.depositPaid} placeholder="0"
                      onChange={(e) => setForm({ ...form, depositPaid: e.target.value })} />
                    <button type="button" onClick={() => setForm({ ...form, depositPaid: String(totals.deposit) })}
                      className="text-xs whitespace-nowrap px-2 rounded-lg border border-mate-200 text-mate-700 hover:bg-mate-50" title="Cargar la seña sugerida">
                      {form.depositPercent || 0}%
                    </button>
                  </div>
                </Field>
                <Field label="Entrega">
                  <input className="input-base" type="date" value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Estado">
                  <select className="input-base" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Notas">
                    <input className="input-base" value={form.notes} placeholder="Grabado con logo, colores, forma de pago..."
                      onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </Field>
                </div>
              </div>

              <div className="bg-mate-50 rounded-xl p-4 text-sm grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><p className="text-mate-500">Total</p><p className="font-bold text-mate-900">{money(totals.total)}</p></div>
                <div><p className="text-mate-500">Seña sugerida</p><p className="font-bold text-mate-900">{money(totals.deposit)}</p></div>
                <div><p className="text-mate-500">Saldo</p><p className="font-bold text-mate-900">{money(Math.max(0, totals.total - (Number(form.depositPaid) || 0)))}</p></div>
                <div><p className="text-mate-500">Ganancia estimada</p><p className={`font-bold ${totals.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{money(totals.profit)}</p></div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setForm(null)} className="flex-1 border border-mate-200 text-mate-700 py-3 rounded-xl font-medium hover:bg-mate-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 bg-mate-800 text-white py-3 rounded-xl font-semibold hover:bg-mate-700 transition-colors disabled:opacity-60">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmar borrado */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-mate-900 mb-2">¿Eliminar el encargo de {deleteTarget.client.name}?</h3>
            <p className="text-sm text-mate-500 mb-5">
              {deleteTarget.status === 'entregado' ? 'También se borra su venta de Finanzas. ' : ''}No se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-mate-200 text-mate-700 py-2.5 rounded-xl font-medium hover:bg-mate-50">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </>
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
