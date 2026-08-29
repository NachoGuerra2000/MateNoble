require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/User');

const app = express();

// Mantiene el usuario admin sincronizado con ADMIN_USERNAME/ADMIN_PASSWORD:
// si esas variables cambian en el hosting, alcanza con reiniciar el servidor.
const ensureAdminUser = async () => {
  try {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    let user = await User.findOne({ username });
    if (!user) {
      await new User({ username, password }).save();
      console.log(`✓ Usuario admin "${username}" creado desde las variables de entorno`);
      return;
    }

    if (!(await user.comparePassword(password))) {
      user.password = password;
      await user.save();
      console.log(`✓ Contraseña de "${username}" sincronizada con las variables de entorno`);
    }
  } catch (err) {
    console.error('Error al sincronizar el usuario admin:', err.message);
  }
};

connectDB().then(ensureAdminUser);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/transactions', require('./routes/transactions'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
