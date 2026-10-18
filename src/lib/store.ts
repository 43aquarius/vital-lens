'use client';

import { create } from 'zustand';

interface AppState {
  reportsVersion: number;
  bumpReports: () => void;
  symptomTranscript: string;
  setSymptomTranscript: (s: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  reportsVersion: 0,
  bumpReports: () => set((s) => ({ reportsVersion: s.reportsVersion + 1 })),
  symptomTranscript: '',
  setSymptomTranscript: (s) => set({ symptomTranscript: s }),
}));
