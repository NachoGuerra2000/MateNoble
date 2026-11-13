const mongoose = require('mongoose');

// Un solo producto para la tienda y para Finanzas.
// "active" = se muestra en la tienda. Los que no se muestran (solo para llevar stock y ventas a mano)
// no necesitan foto, descripción ni categoría; se piden recién al publicarlos.
function shownInStore() {
  return this.active;
}

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Poné el nombre del producto'], trim: true },
    price: { type: Number, required: true, min: 0, default: 0 },
    costPrice: { type: Number, required: true, min: 0, default: 0 },
    // Precio por unidad para empresas, clubes y ventas grandes (0 = no sale en el catálogo para empresas)
    wholesalePrice: { type: Number, min: 0, default: 0 },
    image: { type: String, default: '', required: [shownInStore, 'Para mostrarlo en la tienda falta la foto'] },
    images: { type: [String], default: [] },
    description: { type: String, default: '', required: [shownInStore, 'Para mostrarlo en la tienda falta la descripción'] },
    category: {
      type: String,
      default: 'otros',
      enum: ['calabaza', 'algarrobo', 'madera', 'acero', 'materas', 'bolsos', 'bombillas', 'bombillones', 'combos', 'otros'],
    },
    stock: { type: Number, required: true, min: 0, default: 0 },
    featured: { type: Boolean, default: false },
    // Se muestra aunque no haya stock: se vende por encargo y se pide por WhatsApp
    madeToOrder: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
