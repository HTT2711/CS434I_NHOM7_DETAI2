import axiosClient from './axiosClient';

export const menuApi = {
  getCategories: () => axiosClient.get('/menu/categories'),
  createCategory: (data) => axiosClient.post('/menu/categories', data),
  updateCategory: (id, data) => axiosClient.put(`/menu/categories/${id}`, data),
  deleteCategory: (id) => axiosClient.delete(`/menu/categories/${id}`),

  getItems: (params) => axiosClient.get('/menu/items', { params }),
  getItemById: (id) => axiosClient.get(`/menu/items/${id}`),
  createItem: (data) => axiosClient.post('/menu/items', data),
  updateItem: (id, data) => axiosClient.put(`/menu/items/${id}`, data),
  toggleSelling: (id) => axiosClient.patch(`/menu/items/${id}/toggle-selling`),
  toggleStock: (id) => axiosClient.patch(`/menu/items/${id}/toggle-stock`),
  deleteItem: (id) => axiosClient.delete(`/menu/items/${id}`),
};
