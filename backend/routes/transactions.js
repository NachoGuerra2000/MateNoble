const express = require('express');
const Transaction = require('../models/Transaction');
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

module.exports = router;
