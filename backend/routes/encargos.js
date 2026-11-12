const express = require('express');
const Encargo = require('../models/Encargo');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

const cleanBody = (body) => {
  const data = {};
  if (body.client) {
    data.client = {
      name: String(body.client.name || '').trim(),
      type: body.client.type || 'empresa',
      contact: String(body.client.contact || '').trim(),
    };
  }
  if (Array.isArray(body.items)) {
    data.items = body.items.map((i) => ({
      description: String(i.description || '').trim(),
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      unitCost: i.unitCost === '' || i.unitCost === undefined ? 0 : Number(i.unitCost),
    }));
  }
  if (body.depositPercent !== undefined && body.depositPercent !== '') data.depositPercent = Number(body.depositPercent);
  if (body.depositPaid !== undefined && body.depositPaid !== '') data.depositPaid = Number(body.depositPaid);
  if (body.status !== undefined) data.status = body.status;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate || null;
  if (body.notes !== undefined) data.notes = String(body.notes);
  return data;
};

// Cuando un encargo pasa a "entregado" se registra la venta en Finanzas; si deja de estarlo, se quita
const syncSale = async (encargo) => {
  await Transaction.deleteMany({ encargo: encargo._id });
  if (encargo.status !== 'entregado') return;
  await Transaction.insertMany(
    encargo.items.map((i) => ({
      type: 'venta',
      productName: `${i.description} (encargo: ${encargo.client.name})`,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      unitCost: i.unitCost || 0,
      total: i.quantity * i.unitPrice,
      manual: true,
      channel: 'encargo',
      encargo: encargo._id,
    }))
  );
};

router.get('/', auth, async (req, res) => {
  try {
    res.json(await Encargo.find().sort({ createdAt: -1 }));
  } catch {
    res.status(500).json({ message: 'Error al obtener los encargos' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const encargo = new Encargo(cleanBody(req.body));
    await encargo.save();
    await syncSale(encargo);
    res.status(201).json(encargo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const encargo = await Encargo.findById(req.params.id);
    if (!encargo) return res.status(404).json({ message: 'Encargo no encontrado' });
    encargo.set(cleanBody(req.body));
    await encargo.save();
    await syncSale(encargo);
    res.json(encargo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const encargo = await Encargo.findByIdAndDelete(req.params.id);
    if (!encargo) return res.status(404).json({ message: 'Encargo no encontrado' });
    await Transaction.deleteMany({ encargo: encargo._id });
    res.json({ message: 'Encargo eliminado' });
  } catch {
    res.status(500).json({ message: 'Error al eliminar el encargo' });
  }
});

module.exports = router;
