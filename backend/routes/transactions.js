const express = require('express');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
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
      const key = t.product ? String(t.product) : t.productName;
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

// DELETE /api/transactions/:id — solo admin: borra un movimiento y revierte su efecto en el stock
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Movimiento no encontrado' });

    if (transaction.product) {
      const product = await Product.findById(transaction.product);
      if (product) {
        if (transaction.type === 'compra') {
          product.stock = Math.max(0, product.stock - transaction.quantity);
        } else {
          product.stock += transaction.quantity;
        }
        await product.save();
      }
    }

    await transaction.deleteOne();
    res.json({ message: 'Movimiento eliminado correctamente' });
  } catch {
    res.status(500).json({ message: 'Error al eliminar el movimiento' });
  }
});

module.exports = router;
