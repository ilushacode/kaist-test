import { apiClient } from './client';

export const fetchTeachers = async (group, options = {}) => {
  const { data } = await apiClient.get(`/groups/${group}/teachers`, {
    ...options,
  });
  return data ?? [];
};