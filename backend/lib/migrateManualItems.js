const ManualItem = require('../models/ManualItem');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');

// Pasa los productos que estaban "solo en Finanzas" (ManualItem) a la lista única de productos.
// Quedan ocultos en la tienda hasta que se les cargue foto y se publiquen.
// Usa el mismo _id, así que si se corta a mitad de camino se puede volver a correr sin duplicar nada.
const migrateManualItems = async () => {
  const items = await ManualItem.find();
  if (!items.length) return;

  let moved = 0;
  for (const item of items) {
    const exists = await Product.exists({ _id: item._id });
    if (!exists) {
      await Product.collection.insertOne({
        _id: item._id,
        name: item.name,
        price: item.price || 0,
        costPrice: item.costPrice || 0,
        wholesalePrice: 0,
        image: '',
        images: [],
        description: '',
        category: 'otros',
        stock: item.stock || 0,
        featured: false,
        madeToOrder: false,
        active: false,
        createdAt: item.createdAt || new Date(),
        updatedAt: new Date(),
        __v: 0,
      });
    }
    // Las compras y ventas que tenía pasan a apuntar al producto
    await Transaction.updateMany({ manualItem: item._id }, { $set: { product: item._id, manualItem: null } });
    await ManualItem.deleteOne({ _id: item._id });
    moved++;
  }
  console.log(`✓ ${moved} producto(s) de Finanzas pasados a la lista única de productos`);
};

module.exports = migrateManualItems;
