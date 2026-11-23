import axiosClient from './axiosClient';

export const invoiceApi = {
  create: (data) => axiosClient.post('/invoices', data),
  checkout: (data) => axiosClient.post('/invoices', data),
  createInvoice: (data) => axiosClient.post('/invoices', data),
  mergeTables: (arg1, arg2) => {
    const payload = typeof arg1 === 'object' && arg1 !== null ? arg1 : { sourceTableId: arg1, targetTableId: arg2 };
    return axiosClient.post('/invoices/merge-tables', payload);
  },
  splitBill: (arg1, arg2) => {
    const payload = typeof arg1 === 'object' && arg1 !== null ? arg1 : { orderId: arg1, itemsToSplit: arg2 };
    return axiosClient.post('/invoices/split-bill', payload);
  },
  getAll: (params) => axiosClient.get('/invoices', { params }),
  getById: (id) => axiosClient.get(`/invoices/${id}`),
  getByOrderId: (orderId) => axiosClient.get(`/invoices/order/${orderId}`),
};
