import { create } from 'zustand';

interface StationState {
  earliest: Date | null;
  latest: Date | null;
  stationName: string;

  setEarliest: (date: Date) => void;
  setLatest: (date: Date) => void;
  setStationName: (name: string) => void;

  reset: () => void;
}

export const useStationStore = create<StationState>((set) => ({
  earliest: null,
  latest: null,
  stationName: '',

  setEarliest: (date) => set({ earliest: date }),
  setLatest: (date) => set({ latest: date }),
  setStationName: (name) => set({ stationName: name }),

  reset: () =>
    set({
      earliest: null,
      latest: null,
      stationName: '',
    }),
}));
