import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';

localforage.config({ name: 'schedule-app', storeName: 'state' });

const indexedDBStorage = {
  getItem: async (name) => (await localforage.getItem(name)) ?? null,
  setItem: async (name, value) => { await localforage.setItem(name, value); },
  removeItem: async (name) => { await localforage.removeItem(name); },
};

// YYYY-MM-DD — чтобы удобно сравнивать "было сегодня или нет"
const todayStamp = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const useStore = create(
  persist(
    (set, get) => ({
      // --- Группы ---
      groups: [],                 // [ "ИУ7-42Б", "ИУ7-43Б", ... ]
      selectedGroup: null,        // string | null

      // --- Кэш расписания ---
      // { [groupNumber]: { "01.09": [lesson, ...], "02.09": [...] } }
      scheduleCache: {},

      // Дата (YYYY-MM-DD) последней успешной загрузки кэша
      lastFetchedAt: null,

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
       *
       * @param {string|number} number — номер группы
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
       * @param {string} groupNumber
       * @param {Object} days — { "01.09": [lesson, ...], ... }
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
       * @param {Object} data — { [groupNumber]: { "01.09": [...] } }
       */
      replaceCache: (data) => {
        set({
          scheduleCache: data ?? {},
          lastFetchedAt: todayStamp(),
        });
      },

      clearCache: () => set({ scheduleCache: {}, lastFetchedAt: null }),

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
        // 1. Сбрасываем Zustand-state к начальному
        set({
          groups: [],
          selectedGroup: null,
          scheduleCache: {},
          lastFetchedAt: null,
        });

        // 2. Чистим IndexedDB (persist пишет именно сюда)
        try {
          await localforage.removeItem('schedule-app-storage');
        } catch (e) {
          console.warn('localforage removeItem failed:', e);
        }

        // 3. На всякий случай — localStorage (если что-то там осталось)
        try {
          localStorage.removeItem('schedule-app-storage');
        } catch {}
      },
    }),
    {
      name: 'schedule-app-storage',
      storage: createJSONStorage(() => indexedDBStorage),
      version: 2,
      partialize: (s) => ({
        groups: s.groups,
        selectedGroup: s.selectedGroup,
        scheduleCache: s.scheduleCache,
        lastFetchedAt: s.lastFetchedAt,
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