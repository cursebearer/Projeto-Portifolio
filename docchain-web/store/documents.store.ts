import { create } from 'zustand';
import type { DocumentDto } from '@/types/document';

interface DocumentsState {
  selected: DocumentDto | null;
  setSelected: (doc: DocumentDto | null) => void;
}

export const useDocumentsStore = create<DocumentsState>((set) => ({
  selected: null,
  setSelected: (doc) => set({ selected: doc }),
}));
