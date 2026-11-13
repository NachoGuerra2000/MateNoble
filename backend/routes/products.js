const express = require('express');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Lo que ve cualquier visitante: sin costo de compra ni precio para empresas
const PUBLIC_FIELDS = '-costPrice -wholesalePrice';

// Mensaje claro de validación ("Para mostrarlo en la tienda falta la foto") en vez del texto técnico de Mongoose
const errorMessage = (err) => (err.errors ? Object.values(err.errors)[0].message : err.message);

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
    // Sin stock se ocultan, salvo los que se venden por encargo
    if (includeOutOfStock !== 'true') filter.$or = [{ stock: { $gt: 0 } }, { madeToOrder: true }];

    const products = await Product.find(filter).select(PUBLIC_FIELDS).sort({ createdAt: -1 });
    res.json(products);
  } catch {
    res.status(500).json({ message: 'Error al obtener productos' });
  }
});

// GET /api/products/:id — público
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select(PUBLIC_FIELDS);
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
    res.status(400).json({ message: errorMessage(err) });
  }
});

// PUT /api/products/:id — solo admin
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    const previousStock = product.stock;

    // Se guarda sobre el documento para que las validaciones sepan si se muestra en la tienda
    const { _id, createdAt, updatedAt, __v, ...changes } = req.body;
    product.set(changes);
    await product.save();

    const addedStock = product.stock - previousStock;
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
    res.status(400).json({ message: errorMessage(err) });
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
    res.status(400).json({ message: errorMessage(err) });
  }
});

// POST /api/products/bulk-restock — solo admin: carga de stock por compra mayorista (varios productos a la vez)
router.post('/bulk-restock', auth, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No hay productos para cargar' });
    }

    const toApply = [];
    for (const item of items) {
      const qty = Number(item.quantity);
      if (!item.productId || !qty || qty <= 0) {
        return res.status(400).json({ message: 'Cada producto necesita una cantidad válida' });
      }
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Producto no encontrado (${item.productId})` });
      }
      const unitCost = item.costPrice !== undefined && item.costPrice !== ''
        ? Number(item.costPrice)
        : product.costPrice;
      toApply.push({ product, qty, unitCost });
    }

    const updatedProducts = [];
    for (const { product, qty, unitCost } of toApply) {
      product.stock += qty;
      product.costPrice = unitCost;
      await product.save();

      await Transaction.create({
        type: 'compra',
        product: product._id,
        productName: product.name,
        quantity: qty,
        unitPrice: unitCost,
        total: qty * unitCost,
      });

      updatedProducts.push(product);
    }

    res.json({ products: updatedProducts });
  } catch (err) {
    res.status(400).json({ message: errorMessage(err) });
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
