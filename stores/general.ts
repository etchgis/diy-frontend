import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Slide {
  id: string;
  type: string;
  data?: any;
}

interface Store {
  template?: string;
  slides: Slide[];
  address?: string;
  url?: string;
  location?: string;
  shortcode?: string;
  rotationInterval?: number,
  firstPublish?: boolean;
  publishPassword?: string;
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
  setShortcode: (shortCode: string) => void;
  setRotationInterval: (interval: number) => void;
  setFirstPublish: (firstPublish: boolean) => void;
  setPublishPassword: (publishPassword: string) => void;
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

      setShortcode: (shortcode) => set(() => ({
        shortcode,
      })),

      setRotationInterval: (interval) => set(() => ({
        rotationInterval: interval,
      })),
      setFirstPublish: (firstPublish) => set(() => ({
        firstPublish,
      })),
      setPublishPassword: (publishPassword) => set(() => ({
        publishPassword, 
      })),
    }),
    {
      name: 'general-store' ,
      storage: createJSONStorage(() => localStorage)
    }
  )
);