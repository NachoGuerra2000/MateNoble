const express = require('express');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const ManualItem = require('../models/ManualItem');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/transactions — solo admin: historial (últimos 200 movimientos)
router.get('/', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(200);
    res.json(transactions);
  } catch {
    res.status(500).json({ message: 'Error al obtener movimientos' });
  }
});

// GET /api/transactions/summary — solo admin: totales de inversión y ganancia
router.get('/summary', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find();

    let totalInvested = 0;
    let totalRevenue = 0;
    let totalCost = 0;
    const perProduct = {};

    for (const t of transactions) {
      const key = t.product ? String(t.product) : t.manualItem ? String(t.manualItem) : t.productName;
      if (!perProduct[key]) {
        perProduct[key] = {
          productName: t.productName,
          invested: 0,
          unitsSold: 0,
          revenue: 0,
          cost: 0,
        };
      }

      if (t.type === 'compra') {
        totalInvested += t.total;
        perProduct[key].invested += t.total;
      } else {
        totalRevenue += t.total;
        totalCost += t.unitCost * t.quantity;
        perProduct[key].unitsSold += t.quantity;
        perProduct[key].revenue += t.total;
        perProduct[key].cost += t.unitCost * t.quantity;
      }
    }

    const products = Object.values(perProduct)
      .map((p) => ({ ...p, profit: p.revenue - p.cost }))
      .sort((a, b) => b.revenue - a.revenue);

    res.json({
      totalInvested,
      totalRevenue,
      totalCost,
      totalProfit: totalRevenue - totalCost,
      products,
    });
  } catch {
    res.status(500).json({ message: 'Error al calcular el resumen' });
  }
});

// GET /api/transactions/items — solo admin: productos cargados a mano (no están en la tienda)
router.get('/items', auth, async (req, res) => {
  try {
    const items = await ManualItem.find().sort({ name: 1 });
    res.json(items);
  } catch {
    res.status(500).json({ message: 'Error al obtener los productos manuales' });
  }
});

// DELETE /api/transactions/items/:id — solo admin: borra el producto manual (sus movimientos quedan en el historial)
router.delete('/items/:id', auth, async (req, res) => {
  try {
    const item = await ManualItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado correctamente' });
  } catch {
    res.status(500).json({ message: 'Error al eliminar el producto' });
  }
});

// Busca el producto (de la tienda o manual) al que apunta una carga/venta manual
const findTarget = async ({ productId, manualItemId }) => {
  if (productId) {
    const product = await Product.findById(productId);
    return product ? { doc: product, isStore: true } : null;
  }
  if (manualItemId) {
    const item = await ManualItem.findById(manualItemId);
    return item ? { doc: item, isStore: false } : null;
  }
  return null;
};

const transactionRef = ({ doc, isStore }) =>
  isStore ? { product: doc._id } : { manualItem: doc._id };

// POST /api/transactions/purchase — solo admin: cargar stock a mano.
// Sirve para productos de la tienda (productId), manuales existentes (manualItemId)
// o uno nuevo que solo vive en Finanzas (name).
router.post('/purchase', auth, async (req, res) => {
  try {
    const { productId, manualItemId, name, quantity, unitCost, price } = req.body;
    const qty = Number(quantity);
    if (!qty || qty <= 0) return res.status(400).json({ message: 'Cantidad inválida' });

    let target = await findTarget({ productId, manualItemId });
    if (!target) {
      if (productId || manualItemId) return res.status(404).json({ message: 'Producto no encontrado' });
      const trimmed = (name || '').trim();
      if (!trimmed) return res.status(400).json({ message: 'Poné el nombre del producto' });
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existing = await ManualItem.findOne({ name: new RegExp(`^${escaped}$`, 'i') });
      target = { doc: existing || new ManualItem({ name: trimmed }), isStore: false };
    }

    const { doc } = target;
    const cost = unitCost !== undefined && unitCost !== '' ? Number(unitCost) : doc.costPrice;
    if (Number.isNaN(cost) || cost < 0) return res.status(400).json({ message: 'Costo inválido' });

    doc.stock += qty;
    doc.costPrice = cost;
    if (price !== undefined && price !== '') doc.price = Number(price);
    if (target.isStore) doc.active = true;
    await doc.save();

    const transaction = await Transaction.create({
      type: 'compra',
      ...transactionRef(target),
      productName: doc.name,
      quantity: qty,
      unitPrice: cost,
      total: qty * cost,
      manual: true,
    });

    res.status(201).json({ item: doc, transaction });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/transactions/sale — solo admin: registrar una venta hecha por fuera de la página
router.post('/sale', auth, async (req, res) => {
  try {
    const { productId, manualItemId, quantity, unitPrice } = req.body;
    const qty = Number(quantity);
    if (!qty || qty <= 0) return res.status(400).json({ message: 'Cantidad inválida' });

    const target = await findTarget({ productId, manualItemId });
    if (!target) return res.status(404).json({ message: 'Producto no encontrado' });

    const { doc } = target;
    if (qty > doc.stock) {
      return res.status(400).json({ message: `No hay stock suficiente de "${doc.name}" (quedan ${doc.stock})` });
    }

    const price = unitPrice !== undefined && unitPrice !== '' ? Number(unitPrice) : doc.price;
    if (Number.isNaN(price) || price < 0) return res.status(400).json({ message: 'Precio inválido' });

    doc.stock -= qty;
    await doc.save();

    const transaction = await Transaction.create({
      type: 'venta',
      ...transactionRef(target),
      productName: doc.name,
      quantity: qty,
      unitPrice: price,
      unitCost: doc.costPrice,
      total: qty * price,
      manual: true,
    });

    res.status(201).json({ item: doc, transaction });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/transactions/:id — solo admin: borra un movimiento y revierte su efecto en el stock
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Movimiento no encontrado' });

    // Puede ser un producto de la tienda o uno cargado a mano desde Finanzas
    const item = transaction.product
      ? await Product.findById(transaction.product)
      : transaction.manualItem
        ? await ManualItem.findById(transaction.manualItem)
        : null;
    if (item) {
      if (transaction.type === 'compra') {
        item.stock = Math.max(0, item.stock - transaction.quantity);
      } else {
        item.stock += transaction.quantity;
      }
      await item.save();
    }

    await transaction.deleteOne();
    res.json({ message: 'Movimiento eliminado correctamente' });
  } catch {
    res.status(500).json({ message: 'Error al eliminar el movimiento' });
  }
});

module.exports = router;
