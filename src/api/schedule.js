import { apiClient } from './client';

export const fetchDaySchedule = async (group, date, options = {}) => {
  const { data } = await apiClient.get('/schedule/day', {
    params: { group, date },
    ...options,
  });
  return data?.items ?? [];
};

export const fetchRangeSchedule = async (group, dates, options = {}) => {
  const { data } = await apiClient.get('/schedule/range', {
    params: { group, dates },
    ...options,
  });
  return data?.days ?? {};
};