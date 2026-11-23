import axiosClient from './axiosClient';

export const supportApi = {
  getAll: (params) => axiosClient.get('/support-requests', { params }),
  create: (data) => axiosClient.post('/support-requests', data),
  updateStatus: (id, status) => axiosClient.patch(`/support-requests/${id}/status`, { status }),
};
