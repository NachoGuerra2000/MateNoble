const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const auth = require('../middleware/authMiddleware');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();

const makeStorage = (folder) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    },
  });

const uploadProducto = multer({
  storage: makeStorage('matenoble/productos'),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadComprobante = multer({
  storage: makeStorage('matenoble/comprobantes'),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/', auth, uploadProducto.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No se recibió imagen' });
  res.json({ url: req.file.path });
});

router.post('/comprobante', uploadComprobante.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No se recibió imagen' });
  res.json({ url: req.file.path });
});

module.exports = router;
