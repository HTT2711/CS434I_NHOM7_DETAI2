import axiosClient from './axiosClient';

export const orderApi = {
  create: (data) => axiosClient.post('/orders', data),
  getOrders: (params) => axiosClient.get('/orders', { params }),
  getById: (id) => axiosClient.get(`/orders/${id}`),
  updateStatus: (id, status) => axiosClient.patch(`/orders/${id}/status`, { status }),
  updateItemStatus: (itemId, status) => axiosClient.patch(`/orders/items/${itemId}/status`, { status }),
};
