const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const buildHeaders = (token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const handleResponse = async (res) => {
  // Si el servidor responde HTML (ruta inexistente, backend caído o desactualizado) mostramos un mensaje claro
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    const err = new Error(
      res.status === 404
        ? 'El servidor no reconoce esta acción: puede que el backend no esté actualizado'
        : `Error del servidor (${res.status})`
    );
    err.status = res.status;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(data.message || 'Error en la solicitud');
    err.status = res.status;
    throw err;
  }
  return data;
};

export const authAPI = {
  login: (credentials) =>
    fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(credentials),
    }).then(handleResponse),

  verify: (token) =>
    fetch(`${API_URL}/auth/verify`, {
      headers: buildHeaders(token),
    }).then(handleResponse),
};

export const productsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/products${query ? `?${query}` : ''}`).then(handleResponse);
  },

  getAllAdmin: (token) =>
    fetch(`${API_URL}/products/admin/all`, {
      headers: buildHeaders(token),
    }).then(handleResponse),

  getById: (id) =>
    fetch(`${API_URL}/products/${id}`).then(handleResponse),

  create: (data, token) =>
    fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: buildHeaders(token),
      body: JSON.stringify(data),
    }).then(handleResponse),

  update: (id, data, token) =>
    fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: buildHeaders(token),
      body: JSON.stringify(data),
    }).then(handleResponse),

  delete: (id, token) =>
    fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(token),
    }).then(handleResponse),

  restock: (id, data, token) =>
    fetch(`${API_URL}/products/${id}/restock`, {
      method: 'POST',
      headers: buildHeaders(token),
      body: JSON.stringify(data),
    }).then(handleResponse),

  bulkRestock: (items, token) =>
    fetch(`${API_URL}/products/bulk-restock`, {
      method: 'POST',
      headers: buildHeaders(token),
      body: JSON.stringify({ items }),
    }).then(handleResponse),
};

export const transactionsAPI = {
  getAll: (token) =>
    fetch(`${API_URL}/transactions`, {
      headers: buildHeaders(token),
    }).then(handleResponse),

  getSummary: (token) =>
    fetch(`${API_URL}/transactions/summary`, {
      headers: buildHeaders(token),
    }).then(handleResponse),

  delete: (id, token) =>
    fetch(`${API_URL}/transactions/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(token),
    }).then(handleResponse),

  getManualItems: (token) =>
    fetch(`${API_URL}/transactions/items`, {
      headers: buildHeaders(token),
    }).then(handleResponse),

  updateManualItem: (id, data, token) =>
    fetch(`${API_URL}/transactions/items/${id}`, {
      method: 'PUT',
      headers: buildHeaders(token),
      body: JSON.stringify(data),
    }).then(handleResponse),

  deleteManualItem: (id, token) =>
    fetch(`${API_URL}/transactions/items/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(token),
    }).then(handleResponse),

  purchase: (data, token) =>
    fetch(`${API_URL}/transactions/purchase`, {
      method: 'POST',
      headers: buildHeaders(token),
      body: JSON.stringify(data),
    }).then(handleResponse),

  sale: (data, token) =>
    fetch(`${API_URL}/transactions/sale`, {
      method: 'POST',
      headers: buildHeaders(token),
      body: JSON.stringify(data),
    }).then(handleResponse),
};

export const encargosAPI = {
  getAll: (token) =>
    fetch(`${API_URL}/encargos`, { headers: buildHeaders(token) }).then(handleResponse),

  create: (data, token) =>
    fetch(`${API_URL}/encargos`, {
      method: 'POST',
      headers: buildHeaders(token),
      body: JSON.stringify(data),
    }).then(handleResponse),

  update: (id, data, token) =>
    fetch(`${API_URL}/encargos/${id}`, {
      method: 'PUT',
      headers: buildHeaders(token),
      body: JSON.stringify(data),
    }).then(handleResponse),

  delete: (id, token) =>
    fetch(`${API_URL}/encargos/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(token),
    }).then(handleResponse),
};

// Descarga el Excel con finanzas, inventario, pedidos y encargos
export const exportAPI = {
  downloadExcel: async (token) => {
    const res = await fetch(`${API_URL}/export`, { headers: buildHeaders(token) });
    if (!res.ok) return handleResponse(res);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mate-noble-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
