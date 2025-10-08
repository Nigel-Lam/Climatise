import { create } from "zustand";

interface StationState {
  earliest: Date | null;
  latest: Date | null;

  // single-select (legacy)
  stationName: string;
  setStationName: (name: string) => void;

  // multi-select (new)
  selectedStations: string[];
  setSelectedStations: (names: string[]) => void;

  setEarliest: (date: Date | null) => void;
  setLatest: (date: Date | null) => void;

  reset: () => void;
}

export const useStationStore = create<StationState>((set) => ({
  earliest: null,
  latest: null,

  // initialize BOTH so they’re defined from the start
  stationName: "",
  selectedStations: [],

  setStationName: (name) => set({ stationName: name }),
  setSelectedStations: (names) => set({ selectedStations: names }),

  setEarliest: (date) => set({ earliest: date }),
  setLatest: (date) => set({ latest: date }),

  reset: () =>
    set({
      earliest: null,
      latest: null,
      stationName: "",
      selectedStations: [],
    }),
}));
