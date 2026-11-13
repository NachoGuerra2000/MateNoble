const express = require('express');
const ExcelJS = require('exceljs');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Encargo = require('../models/Encargo');
const auth = require('../middleware/authMiddleware');
const { buildSummary, channelOf, CHANNEL_LABELS } = require('../lib/finance');

const router = express.Router();

const MONEY = '"$"#,##0';
const STATUS_LABELS = { cotizado: 'Cotizado', senado: 'Señado', comprado: 'Comprado al mayorista', entregado: 'Entregado', cancelado: 'Cancelado' };
const ZONE_LABELS = { yerba_buena: 'Yerba Buena', san_miguel: 'San Miguel de Tucumán' };

// Agrega una hoja con encabezado en negrita, columnas con formato y filtro
const addSheet = (wb, name, columns, rows) => {
  const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width || 16, style: c.money ? { numFmt: MONEY } : c.date ? { numFmt: 'dd/mm/yyyy' } : {} }));
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF164721' } };
  rows.forEach((r) => ws.addRow(r));
  if (rows.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  return ws;
};

// GET /api/export — solo admin: descarga un Excel con finanzas, inventario, pedidos y encargos
router.get('/', auth, async (req, res) => {
  try {
    const [summary, transactions, products, orders, encargos] = await Promise.all([
      buildSummary(),
      Transaction.find().sort({ createdAt: -1 }),
      Product.find().sort({ category: 1, name: 1 }),
      Order.find().sort({ createdAt: -1 }),
      Encargo.find().sort({ createdAt: -1 }),
    ]);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Mate Noble';
    wb.created = new Date();

    const resumen = addSheet(wb, 'Resumen', [
      { header: 'Concepto', key: 'k', width: 34 },
      { header: 'Monto', key: 'v', width: 18, money: true },
    ], [
      { k: 'Invertido total (compras de stock)', v: summary.totalInvested },
      { k: 'Ingresos por ventas', v: summary.totalRevenue },
      { k: 'Costo de lo vendido', v: summary.totalCost },
      { k: 'Ganancia', v: summary.totalProfit },
      { k: 'Valor del stock actual (a costo)', v: products.reduce((s, p) => s + p.stock * p.costPrice, 0) },
      { k: 'Señas cobradas en encargos abiertos', v: encargos.filter((e) => !['entregado', 'cancelado'].includes(e.status)).reduce((s, e) => s + e.depositPaid, 0) },
      { k: 'Saldo a cobrar de encargos abiertos', v: encargos.filter((e) => !['entregado', 'cancelado'].includes(e.status)).reduce((s, e) => s + e.balance, 0) },
    ]);
    resumen.addRow([]);
    resumen.addRow([`Exportado el ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Tucuman' })}`]);

    addSheet(wb, 'Ventas por canal', [
      { header: 'Canal', key: 'label', width: 26 },
      { header: 'Ventas', key: 'sales', width: 10 },
      { header: 'Unidades', key: 'units', width: 10 },
      { header: 'Ingresos', key: 'revenue', money: true },
      { header: 'Costo', key: 'cost', money: true },
      { header: 'Ganancia', key: 'profit', money: true },
    ], summary.channels);

    addSheet(wb, 'Ganancia por producto', [
      { header: 'Producto', key: 'productName', width: 40 },
      { header: 'Invertido', key: 'invested', money: true },
      { header: 'Vendidos', key: 'unitsSold', width: 10 },
      { header: 'Ingresos', key: 'revenue', money: true },
      { header: 'Costo', key: 'cost', money: true },
      { header: 'Ganancia', key: 'profit', money: true },
    ], summary.products);

    addSheet(wb, 'Movimientos', [
      { header: 'Fecha', key: 'date', date: true, width: 12 },
      { header: 'Tipo', key: 'type', width: 10 },
      { header: 'Canal', key: 'channel', width: 22 },
      { header: 'Producto', key: 'productName', width: 40 },
      { header: 'Cantidad', key: 'quantity', width: 10 },
      { header: 'Precio/costo unitario', key: 'unitPrice', money: true, width: 20 },
      { header: 'Costo unitario (ventas)', key: 'unitCost', money: true, width: 20 },
      { header: 'Total', key: 'total', money: true },
    ], transactions.map((t) => ({
      date: t.createdAt,
      type: t.type === 'compra' ? 'Compra' : 'Venta',
      channel: t.type === 'venta' ? CHANNEL_LABELS[channelOf(t)] : '',
      productName: t.productName,
      quantity: t.quantity,
      unitPrice: t.unitPrice,
      unitCost: t.type === 'venta' ? t.unitCost : null,
      total: t.total,
    })));

    addSheet(wb, 'Inventario', [
      { header: 'Producto', key: 'name', width: 40 },
      { header: 'Dónde', key: 'where', width: 16 },
      { header: 'Categoría', key: 'category', width: 14 },
      { header: 'Stock', key: 'stock', width: 8 },
      { header: 'Costo', key: 'costPrice', money: true },
      { header: 'Precio de venta', key: 'price', money: true },
      { header: 'Ganás por unidad', key: 'margin', money: true },
      { header: 'Precio empresas', key: 'wholesalePrice', money: true },
      { header: 'Valor stock (costo)', key: 'stockValue', money: true, width: 18 },
      { header: 'Visible en tienda', key: 'active', width: 16 },
    ], [
      ...products.map((p) => ({
        name: p.name, where: p.active ? 'Tienda' : 'Solo Finanzas', category: p.category, stock: p.stock, costPrice: p.costPrice, price: p.price,
        margin: p.price - p.costPrice, wholesalePrice: p.wholesalePrice || null, stockValue: p.stock * p.costPrice, active: p.active ? 'Sí' : 'No',
      })),
    ]);

    addSheet(wb, 'Pedidos web', [
      { header: 'Fecha', key: 'date', date: true, width: 12 },
      { header: 'Cliente', key: 'name', width: 24 },
      { header: 'Teléfono', key: 'phone', width: 16 },
      { header: 'Zona', key: 'zone', width: 22 },
      { header: 'Dirección', key: 'address', width: 30 },
      { header: 'Productos', key: 'items', width: 44 },
      { header: 'Pago', key: 'payment', width: 14 },
      { header: 'Subtotal', key: 'subtotal', money: true },
      { header: 'Envío', key: 'shipping', money: true },
      { header: 'Total', key: 'total', money: true },
    ], orders.map((o) => ({
      date: o.createdAt,
      name: o.customer.name,
      phone: o.customer.phone,
      zone: ZONE_LABELS[o.customer.zone] || o.customer.zone,
      address: o.customer.address,
      items: o.items.map((i) => `${i.name} x${i.quantity}`).join(', '),
      payment: o.paymentMethod === 'efectivo' ? 'Efectivo' : 'Transferencia',
      subtotal: o.subtotal,
      shipping: o.shipping,
      total: o.total,
    })));

    addSheet(wb, 'Encargos', [
      { header: 'Fecha', key: 'date', date: true, width: 12 },
      { header: 'Cliente', key: 'client', width: 26 },
      { header: 'Tipo', key: 'type', width: 12 },
      { header: 'Contacto', key: 'contact', width: 20 },
      { header: 'Detalle', key: 'items', width: 44 },
      { header: 'Estado', key: 'status', width: 22 },
      { header: 'Entrega', key: 'dueDate', date: true, width: 12 },
      { header: 'Total', key: 'total', money: true },
      { header: 'Seña cobrada', key: 'depositPaid', money: true },
      { header: 'Saldo', key: 'balance', money: true },
      { header: 'Ganancia estimada', key: 'profit', money: true, width: 18 },
      { header: 'Notas', key: 'notes', width: 30 },
    ], encargos.map((e) => ({
      date: e.createdAt,
      client: e.client.name,
      type: e.client.type,
      contact: e.client.contact,
      items: e.items.map((i) => `${i.description} x${i.quantity}`).join(', '),
      status: STATUS_LABELS[e.status] || e.status,
      dueDate: e.dueDate,
      total: e.total,
      depositPaid: e.depositPaid,
      balance: e.balance,
      profit: e.total - e.totalCost,
      notes: e.notes,
    })));

    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="mate-noble-${date}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error al exportar:', err);
    if (!res.headersSent) res.status(500).json({ message: 'Error al generar el Excel' });
  }
});

module.exports = router;
