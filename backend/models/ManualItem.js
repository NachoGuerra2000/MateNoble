const mongoose = require('mongoose');

// Producto cargado a mano desde Finanzas: no se muestra en la tienda,
// solo sirve para llevar stock, costo y ventas por fuera de la página.
const manualItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    costPrice: { type: Number, required: true, min: 0, default: 0 },
    price: { type: Number, required: true, min: 0, default: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ManualItem', manualItemSchema);
