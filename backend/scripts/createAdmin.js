require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const existing = await User.findOne({ username });
  if (existing) {
    console.log(`El admin "${username}" ya existe.`);
    process.exit(0);
  }

  const admin = new User({ username, password });
  await admin.save();
  console.log(`✓ Admin creado: "${username}" / "${password}"`);
  console.log('  Cambia la contraseña en .env antes de ir a producción.');
  process.exit(0);
};

createAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
