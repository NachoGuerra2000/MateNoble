const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['compra', 'venta'], required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
