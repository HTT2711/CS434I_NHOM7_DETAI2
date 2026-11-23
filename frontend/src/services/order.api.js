import axiosClient from './axiosClient';

export const orderApi = {
  create: (data) => axiosClient.post('/orders', data),
  getAll: (params) => axiosClient.get('/orders', { params }),
  getOrders: (params) => axiosClient.get('/orders', { params }),
  getById: (id) => axiosClient.get(`/orders/${id}`),
  updateStatus: (id, status) => axiosClient.patch(`/orders/${id}/status`, { status }),
  updateItemStatus: (itemId, status) => axiosClient.patch(`/orders/items/${itemId}/status`, { status }),
  confirmOrder: (id) => axiosClient.post(`/orders/${id}/confirm`),
  cancelOrder: (id, reason) => axiosClient.post(`/orders/${id}/cancel`, { reason }),
  cancelItem: (itemId, reason, isCustomer) => axiosClient.post(`/orders/items/${itemId}/cancel`, { reason, isCustomer }),
};
