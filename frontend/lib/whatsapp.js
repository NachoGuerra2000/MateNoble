// Número de WhatsApp de Mate Noble (381 212-9848) en formato internacional
export const WHATSAPP_NUMBER = '5493812129848';
export const WHATSAPP_DISPLAY = '381 212-9848';

export const waLink = (text) =>
  `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
