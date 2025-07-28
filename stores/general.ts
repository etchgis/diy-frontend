import { create } from 'zustand';

interface Slide {
  id: string;
  type: string;
}

interface Store {
  template?: string;
  slides?: Slide[];
  setTemplate: (name: string) => void;
  setSlides: (slides: Slide[]) => void; 
}

export const useGeneralStore = create<Store>((set, get) => ({
  slides: [], 

  setSlides: (slides: Slide[]) => set(() => ({
    slides, 
  })),

  setTemplate: (name) => set(() => ({
    template: name,
  })),
}));