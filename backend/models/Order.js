const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      zone: { type: String, enum: ['yerba_buena', 'san_miguel'], required: true },
    },
    items: [
      {
        productId: String,
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    total: { type: Number, required: true },
    comprobante: { type: String, default: null },
    status: { type: String, default: 'pendiente' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
