import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Slide {
  id: string;
  type: string;
}

interface Store {
  template?: string;
  slides: Slide[];
  address?: string;
  url?: string;
  location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  setTemplate: (name: string) => void;
  setSlides: (slides: Slide[]) => void; 
  setAddress: (address: string) => void;
  setLocation: (location: string) => void;
  setUrl: (url: string) => void;
  setCoordinates: (coordinates: { lat: number; lng: number }) => void;
}

export const useGeneralStore = create<Store>()(
  persist(
    (set, get) => ({
      slides: [],

      setSlides: (slides: Slide[]) => set(() => ({
        slides, 
      })),

      setTemplate: (name) => set(() => ({
        template: name,
      })),

      setAddress: (address) => set(() => ({
        address,
      })),

      setLocation: (location) => set(() => ({
        location,
      })),

      setCoordinates: (coordinates) => set(() => ({
        coordinates,
      })),

      setUrl: (url) => set(() => ({
        url,
      })),
    }),
    {
      name: 'general-store' ,
      storage: createJSONStorage(() => localStorage)
    }
  )
);