import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';

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
      groups: [],
      selectedGroup: null,

      // --- Кэш расписания ---
      // Сырой объект groups из schedule.json: { [номер группы]: Lesson[] }
      scheduleGroups: {},
      scheduleHash: null,
      scheduleUpdatedAt: null,

      // --- Кэш экзаменов ---
      // Сырой объект groups из exams.json: { [номер группы]: Exam[] }
      examsGroups: {},
      examsHash: null,
      examsUpdatedAt: null,

      // --- Состояние загрузки ---
      // true, пока идёт первичная загрузка и кэша ещё нет
      scheduleLoading: false,
      // true, если загрузка провалилась и кэша нет
      scheduleError: false,
      // Счётчик запросов на повторную загрузку (bump → useBootstrap перезапускается)
      bootstrapRetry: 0,

      // Цветовая тема приложения
      theme: 'auto',

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
        const { groups, selectedGroup } = get();
        const newGroups = groups.filter((g) => g !== number);
        set({
          groups: newGroups,
          selectedGroup:
            selectedGroup === number ? newGroups[0] ?? null : selectedGroup,
        });
      },

      selectGroup: (number) => set({ selectedGroup: number }),

      setSingleGroup: (number) => {
        const normalized = String(number).trim();
        if (!normalized) return;
        set({
          groups: [normalized],
          selectedGroup: normalized,
        });
      },

      // --- Кэш данных ---

      setScheduleCache: ({ groups, contentHash, updatedAt }) => {
        set({
          scheduleGroups: groups ?? {},
          scheduleHash: contentHash ?? null,
          scheduleUpdatedAt: updatedAt ?? null,
          scheduleError: false,
          scheduleLoading: false,
        });
      },

      setExamsCache: ({ groups, contentHash, updatedAt }) => {
        set({
          examsGroups: groups ?? {},
          examsHash: contentHash ?? null,
          examsUpdatedAt: updatedAt ?? null,
        });
      },

      setScheduleLoading: (scheduleLoading) =>
        set({ scheduleLoading: Boolean(scheduleLoading) }),

      setScheduleError: (scheduleError) =>
        set({ scheduleError: Boolean(scheduleError) }),

      /** Просит useBootstrap повторить загрузку. */
      retryBootstrap: () => set({ bootstrapRetry: get().bootstrapRetry + 1 }),

      // Тема
      setTheme: (theme) => {
        set({ theme });
        try {
          localStorage.setItem('theme', theme);
        } catch {}
      },

      // Полный сброс
      resetAll: async () => {
        set({
          groups: [],
          selectedGroup: null,
          scheduleGroups: {},
          scheduleHash: null,
          scheduleUpdatedAt: null,
          examsGroups: {},
          examsHash: null,
          examsUpdatedAt: null,
          scheduleLoading: false,
          scheduleError: false,
          bootstrapRetry: 0,
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
      version: 4,
      partialize: (s) => ({
        groups: s.groups,
        selectedGroup: s.selectedGroup,
        scheduleGroups: s.scheduleGroups,
        scheduleHash: s.scheduleHash,
        scheduleUpdatedAt: s.scheduleUpdatedAt,
        examsGroups: s.examsGroups,
        examsHash: s.examsHash,
        examsUpdatedAt: s.examsUpdatedAt,
        theme: s.theme,
      }),
      migrate: (persisted, version) => {
        if (version < 2 && persisted?.groups) {
          persisted.groups = persisted.groups.map((g) =>
            typeof g === 'string' ? g : g.number
          );
        }
        if (version < 3 && persisted) {
          delete persisted.scheduleCache;
          delete persisted.lastFetchedAt;
        }
        // v4: добавили scheduleLoading/Error/Retry — не персистим,
        // поэтому специальной миграции не нужно.
        return persisted;
      },
    }
  )
);