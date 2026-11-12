const mongoose = require('mongoose');

// Venta grande por encargo (empresas, clubes, egresados, comercios): se cotiza,
// se cobra una seña, se compra al mayorista y se entrega. Al entregarse se registra la venta en Finanzas.
const encargoSchema = new mongoose.Schema(
  {
    client: {
      name: { type: String, required: true, trim: true },
      type: {
        type: String,
        enum: ['empresa', 'comercio', 'club', 'egresados', 'particular', 'otro'],
        default: 'empresa',
      },
      contact: { type: String, trim: true, default: '' },
    },
    items: {
      type: [
        {
          description: { type: String, required: true, trim: true },
          quantity: { type: Number, required: true, min: 1 },
          unitPrice: { type: Number, required: true, min: 0 },
          unitCost: { type: Number, default: 0, min: 0 },
        },
      ],
      validate: [(v) => v.length > 0, 'Agregá al menos un producto'],
    },
    depositPercent: { type: Number, default: 50, min: 0, max: 100 },
    depositPaid: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['cotizado', 'senado', 'comprado', 'entregado', 'cancelado'],
      default: 'cotizado',
    },
    dueDate: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

encargoSchema.virtual('total').get(function () {
  return this.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
});
encargoSchema.virtual('totalCost').get(function () {
  return this.items.reduce((sum, i) => sum + i.quantity * (i.unitCost || 0), 0);
});
encargoSchema.virtual('depositSuggested').get(function () {
  return Math.round((this.total * this.depositPercent) / 100);
});
// Lo que falta cobrar: al entregarse se cobra el resto, y si se cancela no se cobra nada más
encargoSchema.virtual('balance').get(function () {
  if (['entregado', 'cancelado'].includes(this.status)) return 0;
  return Math.max(0, this.total - this.depositPaid);
});

module.exports = mongoose.model('Encargo', encargoSchema);
