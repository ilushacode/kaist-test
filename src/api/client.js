// src/api/client.js
import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS } from '../config';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
});

/** Проверяет, что ошибка — отмена запроса */
export const isCancelError = (err) =>
  axios.isCancel?.(err) || err?.name === 'CanceledError';