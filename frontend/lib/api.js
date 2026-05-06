const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const buildHeaders = (token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error en la solicitud');
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
};
