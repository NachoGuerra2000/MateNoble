const express = require('express');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/products/admin/all — debe ir antes de /:id
router.get('/admin/all', auth, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch {
    res.status(500).json({ message: 'Error al obtener productos' });
  }
});

// GET /api/products — público, con filtros
router.get('/', async (req, res) => {
  try {
    const { category, featured, includeOutOfStock } = req.query;
    const filter = { active: true };
    if (category) filter.category = category;
    if (featured === 'true') filter.featured = true;
    if (includeOutOfStock !== 'true') filter.stock = { $gt: 0 };

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch {
    res.status(500).json({ message: 'Error al obtener productos' });
  }
});

// GET /api/products/:id — público
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(product);
  } catch {
    res.status(500).json({ message: 'Error al obtener producto' });
  }
});

// POST /api/products — solo admin
router.post('/', auth, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();

    if (product.stock > 0) {
      await Transaction.create({
        type: 'compra',
        product: product._id,
        productName: product.name,
        quantity: product.stock,
        unitPrice: product.costPrice,
        total: product.stock * product.costPrice,
      });
    }

    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/products/:id — solo admin
router.put('/:id', auth, async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Producto no encontrado' });

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    const addedStock = product.stock - existing.stock;
    if (addedStock > 0) {
      await Transaction.create({
        type: 'compra',
        product: product._id,
        productName: product.name,
        quantity: addedStock,
        unitPrice: product.costPrice,
        total: addedStock * product.costPrice,
      });
    }

    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/products/:id/restock — solo admin: reponer stock sin editar todo el producto
router.post('/:id/restock', auth, async (req, res) => {
  try {
    const { quantity, costPrice } = req.body;
    const qty = Number(quantity);
    if (!qty || qty <= 0) return res.status(400).json({ message: 'Cantidad inválida' });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    const unitCost = costPrice !== undefined && costPrice !== '' ? Number(costPrice) : product.costPrice;

    product.stock += qty;
    product.costPrice = unitCost;
    product.active = true;
    await product.save();

    await Transaction.create({
      type: 'compra',
      product: product._id,
      productName: product.name,
      quantity: qty,
      unitPrice: unitCost,
      total: qty * unitCost,
    });

    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/products/:id — solo admin
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado correctamente' });
  } catch {
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
});

module.exports = router;
