const express = require('express');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const auth = require('../middleware/authMiddleware');
const { buildSummary } = require('../lib/finance');

const MANUAL_CHANNELS = ['instagram', 'marketplace', 'whatsapp', 'boca_a_boca', 'otro'];

const router = express.Router();

const errorMessage = (err) => (err.errors ? Object.values(err.errors)[0].message : err.message);
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
    res.json(await buildSummary());
  } catch {
    res.status(500).json({ message: 'Error al calcular el resumen' });
  }
});

// GET /api/transactions/items — ya no hay productos aparte en Finanzas: todo está en la lista única.
// Queda vacía para que una versión vieja del panel no falle mientras se actualiza.
router.get('/items', auth, (req, res) => res.json([]));

// POST /api/transactions/purchase — solo admin: cargar stock a mano.
// Sirve para un producto existente (productId) o uno nuevo por nombre: si no existe, se crea
// oculto en la tienda (se publica después cargándole foto y descripción).
router.post('/purchase', auth, async (req, res) => {
  try {
    const { productId, name, quantity, unitCost, price } = req.body;
    const qty = Number(quantity);
    if (!qty || qty <= 0) return res.status(400).json({ message: 'Cantidad inválida' });

    let product = productId ? await Product.findById(productId) : null;
    if (!product) {
      if (productId) return res.status(404).json({ message: 'Producto no encontrado' });
      const trimmed = (name || '').trim();
      if (!trimmed) return res.status(400).json({ message: 'Poné el nombre del producto' });
      // Si ya existe uno con el mismo nombre se suma a ese, para no crear repetidos
      product = (await Product.findOne({ name: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') }))
        || new Product({ name: trimmed, active: false });
    }

    const cost = unitCost !== undefined && unitCost !== '' ? Number(unitCost) : product.costPrice;
    if (Number.isNaN(cost) || cost < 0) return res.status(400).json({ message: 'Costo inválido' });

    product.stock += qty;
    product.costPrice = cost;
    if (price !== undefined && price !== '') product.price = Number(price);
    await product.save();

    const transaction = await Transaction.create({
      type: 'compra',
      product: product._id,
      productName: product.name,
      quantity: qty,
      unitPrice: cost,
      total: qty * cost,
      manual: true,
    });

    res.status(201).json({ item: product, transaction });
  } catch (err) {
    res.status(400).json({ message: errorMessage(err) });
  }
});

// POST /api/transactions/sale — solo admin: registrar una venta hecha por fuera de la página
router.post('/sale', auth, async (req, res) => {
  try {
    const { productId, quantity, unitPrice, channel } = req.body;
    const qty = Number(quantity);
    if (!qty || qty <= 0) return res.status(400).json({ message: 'Cantidad inválida' });
    if (!MANUAL_CHANNELS.includes(channel))
      return res.status(400).json({ message: 'Elegí por dónde vino la venta' });

    const product = productId ? await Product.findById(productId) : null;
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    if (qty > product.stock) {
      return res.status(400).json({ message: `No hay stock suficiente de "${product.name}" (quedan ${product.stock})` });
    }

    const price = unitPrice !== undefined && unitPrice !== '' ? Number(unitPrice) : product.price;
    if (Number.isNaN(price) || price < 0) return res.status(400).json({ message: 'Precio inválido' });

    product.stock -= qty;
    await product.save();

    const transaction = await Transaction.create({
      type: 'venta',
      product: product._id,
      productName: product.name,
      quantity: qty,
      unitPrice: price,
      unitCost: product.costPrice,
      total: qty * price,
      manual: true,
      channel,
    });

    res.status(201).json({ item: product, transaction });
  } catch (err) {
    res.status(400).json({ message: errorMessage(err) });
  }
});

// DELETE /api/transactions/:id — solo admin: borra un movimiento y revierte su efecto en el stock
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Movimiento no encontrado' });
    if (transaction.encargo)
      return res.status(400).json({ message: 'Esta venta es de un encargo: cambiá el estado del encargo desde la pestaña Encargos' });

    const product = transaction.product ? await Product.findById(transaction.product) : null;
    if (product) {
      if (transaction.type === 'compra') {
        product.stock = Math.max(0, product.stock - transaction.quantity);
      } else {
        product.stock += transaction.quantity;
      }
      await product.save();
    }

    await transaction.deleteOne();
    res.json({ message: 'Movimiento eliminado correctamente' });
  } catch {
    res.status(500).json({ message: 'Error al eliminar el movimiento' });
  }
});

module.exports = router;
