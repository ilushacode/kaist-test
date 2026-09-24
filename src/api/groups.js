import { apiClient } from './client';

export const fetchGroups = async (query, options = {}) => {
  const { data } = await apiClient.get('/groups', {
    params: { query },
    ...options,
  });
  return data ?? [];
};