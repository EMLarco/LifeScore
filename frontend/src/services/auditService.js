import api from '../api/axiosConfig';

export const getAuditData = async () => {
  const res = await api.get('/admin/audit');
  return res.data.data;
};
