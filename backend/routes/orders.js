const express = require('express');
const { Resend } = require('resend');
const Order = require('../models/Order');
const auth = require('../middleware/authMiddleware');

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

const SHIPPING_COST = 4000;
const ZONE_LABELS = { yerba_buena: 'Yerba Buena', san_miguel: 'San Miguel de Tucumán' };

const sendAdminEmail = async (order) => {
  const itemsHtml = order.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${(i.price * i.quantity).toLocaleString('es-AR')}</td>
        </tr>`
    )
    .join('');

  await resend.emails.send({
    from: 'Mate Noble <onboarding@resend.dev>',
    to: process.env.ADMIN_EMAIL,
    subject: `🛒 Nueva compra - ${order.customer.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#164721;padding:24px;border-radius:12px 12px 0 0">
          <h1 style="color:white;margin:0;font-size:22px">Nueva compra en Mate Noble</h1>
        </div>
        <div style="background:#f0faf2;padding:24px;border-radius:0 0 12px 12px">

          <h2 style="color:#164721;margin-top:0">Datos del cliente</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:4px 0;color:#555">Nombre:</td><td style="padding:4px 0;font-weight:bold">${order.customer.name}</td></tr>
            <tr><td style="padding:4px 0;color:#555">Teléfono:</td><td style="padding:4px 0">${order.customer.phone}</td></tr>
            <tr><td style="padding:4px 0;color:#555">Dirección:</td><td style="padding:4px 0">${order.customer.address}</td></tr>
            <tr><td style="padding:4px 0;color:#555">Zona:</td><td style="padding:4px 0">${ZONE_LABELS[order.customer.zone]}</td></tr>
            <tr><td style="padding:4px 0;color:#555">Pago:</td><td style="padding:4px 0;font-weight:bold;color:${order.paymentMethod === 'efectivo' ? '#d97706' : '#164721'}">${order.paymentMethod === 'efectivo' ? '💵 Efectivo (coordinar con el cliente)' : '🏦 Transferencia'}</td></tr>
          </table>

          <h2 style="color:#164721">Productos</h2>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#d8f3dc">
                <th style="padding:8px;text-align:left">Producto</th>
                <th style="padding:8px;text-align:center">Cant.</th>
                <th style="padding:8px;text-align:right">Subtotal</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <div style="margin-top:16px;text-align:right">
            <p style="margin:4px 0;color:#555">Subtotal: <strong>$${order.subtotal.toLocaleString('es-AR')}</strong></p>
            <p style="margin:4px 0;color:#555">Envío: <strong>${order.shipping > 0 ? '$' + order.shipping.toLocaleString('es-AR') : 'Sin costo'}</strong></p>
            <p style="margin:8px 0;font-size:18px;color:#164721">TOTAL: <strong>$${order.total.toLocaleString('es-AR')}</strong></p>
          </div>

          ${order.paymentMethod === 'efectivo' ? `
          <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:12px;margin-top:16px">
            <p style="margin:0;color:#92400e;font-weight:bold">💵 Pago en efectivo</p>
            <p style="margin:4px 0 0;color:#92400e;font-size:13px">Coordinar entrega y cobro con el cliente.</p>
          </div>
          ` : order.comprobante ? `
          <h2 style="color:#164721">Comprobante de pago</h2>
          <img src="${order.comprobante}" style="max-width:100%;border-radius:8px;border:1px solid #d8f3dc" alt="Comprobante"/>
          ` : ''}

          <p style="margin-top:24px;color:#888;font-size:12px">ID de orden: ${order._id}</p>
        </div>
      </div>
    `,
  });
};


const sendWhatsApp = async (order) => {
  const phone = process.env.WHATSAPP_PHONE;
  const apiKey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apiKey) return;

  const itemsList = order.items.map((i) => `• ${i.name} x${i.quantity}`).join('%0A');
  const zone = ZONE_LABELS[order.customer.zone];
  const message = `🛒 *Nueva compra - Mate Noble*%0A%0A`
    + `👤 *${order.customer.name}*%0A`
    + `📞 ${order.customer.phone}%0A`
    + `📍 ${zone} - ${order.customer.address}%0A%0A`
    + `*Productos:*%0A${itemsList}%0A%0A`
    + `💰 *Total: $${order.total.toLocaleString('es-AR')}*%0A`
    + (order.comprobante ? `%0A✅ Comprobante adjunto en el email` : `%0A⚠️ Sin comprobante adjunto`);

  await fetch(
    `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${message}&apikey=${apiKey}`
  );
};

// Crear orden, enviar email y WhatsApp
router.post('/', async (req, res) => {
  try {
    const { customer, items, subtotal } = req.body;
    if (!customer || !items || !subtotal)
      return res.status(400).json({ message: 'Datos incompletos' });

    const shipping = customer.zone === 'san_miguel' ? SHIPPING_COST : 0;
    const total = subtotal + shipping;

    const order = new Order({ customer, items, subtotal, shipping, total, comprobante: req.body.comprobante || null, paymentMethod: req.body.paymentMethod || 'transferencia' });
    await order.save();

    // Notificaciones en paralelo, sin bloquear la respuesta
    Promise.all([
      sendAdminEmail(order).catch((err) => console.error('Error email:', err)),
      sendWhatsApp(order).catch((err) => console.error('Error WhatsApp:', err)),
    ]);

    res.status(201).json({ orderId: order._id, shipping, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Listar órdenes (admin)
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch {
    res.status(500).json({ message: 'Error al obtener órdenes' });
  }
});

module.exports = router;
