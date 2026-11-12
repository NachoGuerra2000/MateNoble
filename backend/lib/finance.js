const Transaction = require('../models/Transaction');

const CHANNEL_LABELS = {
  web: 'Página web',
  instagram: 'Instagram',
  marketplace: 'Marketplace',
  whatsapp: 'WhatsApp',
  boca_a_boca: 'Boca a boca',
  encargo: 'Encargo / venta grande',
  otro: 'Otro',
  sin_dato: 'Sin dato (ventas viejas)',
};

// Canal de una venta: las ventas viejas no lo tienen; si vinieron de la web lo sabemos por el pedido
const channelOf = (t) => t.channel || (t.orderId ? 'web' : 'sin_dato');

// Totales de inversión, ventas y ganancia; por producto y por canal
const buildSummary = async () => {
  const transactions = await Transaction.find();

  let totalInvested = 0;
  let totalRevenue = 0;
  let totalCost = 0;
  const perProduct = {};
  const perChannel = {};

  for (const t of transactions) {
    const key = t.product ? String(t.product) : t.manualItem ? String(t.manualItem) : t.productName;
    if (!perProduct[key]) {
      perProduct[key] = { productName: t.productName, invested: 0, unitsSold: 0, revenue: 0, cost: 0 };
    }

    if (t.type === 'compra') {
      totalInvested += t.total;
      perProduct[key].invested += t.total;
    } else {
      const cost = t.unitCost * t.quantity;
      totalRevenue += t.total;
      totalCost += cost;
      perProduct[key].unitsSold += t.quantity;
      perProduct[key].revenue += t.total;
      perProduct[key].cost += cost;

      const ch = channelOf(t);
      if (!perChannel[ch]) perChannel[ch] = { channel: ch, label: CHANNEL_LABELS[ch] || ch, sales: 0, units: 0, revenue: 0, cost: 0 };
      perChannel[ch].sales += 1;
      perChannel[ch].units += t.quantity;
      perChannel[ch].revenue += t.total;
      perChannel[ch].cost += cost;
    }
  }

  const products = Object.values(perProduct)
    .map((p) => ({ ...p, profit: p.revenue - p.cost }))
    .sort((a, b) => b.revenue - a.revenue);

  const channels = Object.values(perChannel)
    .map((c) => ({ ...c, profit: c.revenue - c.cost }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    totalInvested,
    totalRevenue,
    totalCost,
    totalProfit: totalRevenue - totalCost,
    products,
    channels,
  };
};

module.exports = { buildSummary, channelOf, CHANNEL_LABELS };
