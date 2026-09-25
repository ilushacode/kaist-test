import { apiClient } from './client';

export const fetchStudents = async (group, options = {}) => {
  const { data } = await apiClient.get(`/groups/${group}/students`, {
    ...options,
  });
  return data ?? [];
};