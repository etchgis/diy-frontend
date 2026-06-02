import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type FooterSectionType = 'image' | 'time' | 'text' | 'none';

interface FooterState {
  leftImage: string;
  middleImage: string;
  rightImage: string;
  leftType: FooterSectionType;
  middleType: FooterSectionType;
  rightType: FooterSectionType;
  leftText: string;
  middleText: string;
  rightText: string;
  backgroundColor: string;
  timeTextColor: string;
  setLeftImage: (image: string) => void;
  setMiddleImage: (image: string) => void;
  setRightImage: (image: string) => void;
  setLeftType: (type: FooterSectionType) => void;
  setMiddleType: (type: FooterSectionType) => void;
  setRightType: (type: FooterSectionType) => void;
  setLeftText: (text: string) => void;
  setMiddleText: (text: string) => void;
  setRightText: (text: string) => void;
  setBackgroundColor: (color: string) => void;
  setTimeTextColor: (color: string) => void;
}

export const useFooterStore = create<FooterState>()(
  persist(
    (set) => ({
      leftImage: '/images/statewide-mobility-services.png',
      middleImage: '',
      rightImage: '/images/nysdot-footer-logo.png',
      leftType: 'image',
      middleType: 'image',
      rightType: 'image',
      leftText: '',
      middleText: '',
      rightText: '',
      backgroundColor: '#F4F4F4',
      timeTextColor: '#000000',
      setLeftImage: (image) => set({ leftImage: image }),
      setMiddleImage: (image) => set({ middleImage: image }),
      setRightImage: (image) => set({ rightImage: image }),
      setLeftType: (type) => set({ leftType: type }),
      setMiddleType: (type) => set({ middleType: type }),
      setRightType: (type) => set({ rightType: type }),
      setLeftText: (text) => set({ leftText: text }),
      setMiddleText: (text) => set({ middleText: text }),
      setRightText: (text) => set({ rightText: text }),
      setBackgroundColor: (color) => set({ backgroundColor: color }),
      setTimeTextColor: (color) => set({ timeTextColor: color }),
    }),
    {
      name: 'footer-store',
    }
  )
);
