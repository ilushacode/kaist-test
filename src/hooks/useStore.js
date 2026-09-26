import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';
import { todayStamp } from '../utils/date';

localforage.config({ name: 'schedule-app', storeName: 'state' });

const indexedDBStorage = {
  getItem: async (name) => (await localforage.getItem(name)) ?? null,
  setItem: async (name, value) => {
    await localforage.setItem(name, value);
  },
  removeItem: async (name) => {
    await localforage.removeItem(name);
  },
};

const STORAGE_KEY = 'schedule-app-storage';

export const useStore = create(
  persist(
    (set, get) => ({
      // --- Группы ---
      groups: [],           // [ "ИУ7-42Б", "ИУ7-43Б", ... ]
      selectedGroup: null,  // string | null

      // --- Кэш расписания ---
      // { [groupNumber]: { "01.09": [lesson, ...], "02.09": [...] } }
      scheduleCache: {},

      // Дата (YYYY-MM-DD) последней успешной загрузки кэша
      lastFetchedAt: null,

      // Цветовая тема приложения
      theme: 'auto',   // 'auto' | 'light' | 'dark'

      // --- Действия с группами ---
      addGroup: (number) => {
        const normalized = String(number).trim();
        if (!normalized) return;
        const { groups, selectedGroup } = get();
        if (groups.includes(normalized)) return;
        set({
          groups: [...groups, normalized],
          selectedGroup: selectedGroup ?? normalized,
        });
      },

      removeGroup: (number) => {
        const { groups, selectedGroup, scheduleCache } = get();
        const newGroups = groups.filter((g) => g !== number);
        const newCache = { ...scheduleCache };
        delete newCache[number];
        set({
          groups: newGroups,
          scheduleCache: newCache,
          selectedGroup:
            selectedGroup === number ? newGroups[0] ?? null : selectedGroup,
        });
      },

      selectGroup: (number) => set({ selectedGroup: number }),

      /**
       * Устанавливает единственную группу.
       * Удаляет все предыдущие группы и кэш расписания,
       * добавляет новую группу и делает её выбранной.
       */
      setSingleGroup: (number) => {
        const normalized = String(number).trim();
        if (!normalized) return;
        set({
          groups: [normalized],
          selectedGroup: normalized,
          scheduleCache: {},
          lastFetchedAt: null,
        });
      },

      // --- Кэш расписания ---

      /**
       * Заменяет кэш для группы целиком.
       */
      setGroupSchedule: (groupNumber, days) => {
        set({
          scheduleCache: {
            ...get().scheduleCache,
            [groupNumber]: days ?? {},
          },
        });
      },

      /**
       * Сохраняет свежие данные для всех групп сразу и обновляет дату.
       */
      replaceCache: (data) => {
        set({
          scheduleCache: data ?? {},
          lastFetchedAt: todayStamp(),
        });
      },

      clearCache: () => set({ scheduleCache: {}, lastFetchedAt: null }),

      // Установка цветовой темы
      setTheme: (theme) => {
        set({ theme });
        try {
          localStorage.setItem('theme', theme);
        } catch {}
      },

      // --- Селекторы ---

      /** Занятия на конкретную дату ("24.09") для группы. */
      getLessonsByDate: (groupNumber, dm) => {
        return get().scheduleCache[groupNumber]?.[dm] ?? [];
      },

      /** Нужно ли обновлять кэш — если сегодня ещё не обновляли. */
      needsUpdate: () => get().lastFetchedAt !== todayStamp(),

      /**
       * Полный сброс: очищаем state, IndexedDB, localStorage.
       * Использовать только для тестирования.
       */
      resetAll: async () => {
        set({
          groups: [],
          selectedGroup: null,
          scheduleCache: {},
          lastFetchedAt: null,
          theme: 'auto',
        });

        try {
          await localforage.removeItem(STORAGE_KEY);
        } catch (e) {
          console.warn('localforage removeItem failed:', e);
        }

        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => indexedDBStorage),
      version: 2,
      partialize: (s) => ({
        groups: s.groups,
        selectedGroup: s.selectedGroup,
        scheduleCache: s.scheduleCache,
        lastFetchedAt: s.lastFetchedAt,
        theme: s.theme,
      }),
      migrate: (persisted, version) => {
        // v1 хранил группы как [{ number, title }] — приводим к строкам
        if (version < 2 && persisted?.groups) {
          persisted.groups = persisted.groups.map((g) =>
            typeof g === 'string' ? g : g.number
          );
        }
        return persisted;
      },
    }
  )
);