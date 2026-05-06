require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const products = [
  {
    name: 'Mate Calabaza Imperial',
    price: 2800,
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&q=80',
    description: 'Mate de calabaza curada a mano, con terminación natural y boquilla de alpaca. Ideal para quienes buscan la tradición gaucha en su máxima expresión.',
    category: 'calabaza',
    stock: 15,
    featured: true,
  },
  {
    name: 'Mate Calabaza Bombilla Plateada',
    price: 3200,
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500&q=80',
    description: 'Calabaza curada con bombilla de acero inoxidable incluida. Perfecta para el uso cotidiano, liviana y resistente.',
    category: 'calabaza',
    stock: 8,
    featured: false,
  },
  {
    name: 'Mate Algarrobo Rústico',
    price: 4500,
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500&q=80',
    description: 'Tallado a mano en madera de algarrobo del norte argentino. Cada pieza es única gracias a las vetas naturales de la madera.',
    category: 'algarrobo',
    stock: 6,
    featured: true,
  },
  {
    name: 'Mate Algarrobo Premium',
    price: 5800,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80',
    description: 'Pieza artesanal premium de algarrobo seleccionado, con acabado en aceite de lino. Conserva el calor por más tiempo.',
    category: 'algarrobo',
    stock: 4,
    featured: true,
  },
  {
    name: 'Mate Madera Nativa',
    price: 3800,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80',
    description: 'Fabricado con madera nativa patagónica, tratada con aceites naturales. Diseño moderno con esencia tradicional.',
    category: 'madera',
    stock: 10,
    featured: false,
  },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`✓ ${products.length} productos de ejemplo creados.`);
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
