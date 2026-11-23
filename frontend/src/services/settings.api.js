import axiosClient from './axiosClient';

export const settingsApi = {
  get: () => axiosClient.get('/settings'),
  update: (data) => axiosClient.put('/settings', data),
};
