import { useEffect, useRef, useState } from 'react';

type ZustandStore = {
  subscribe: (listener: (state: any, prevState: any) => void) => () => void;
  getState: () => any;
};

/**
 * Tracks real save status by subscribing to actual Zustand store changes.
 */
export function useLocalSaveStatus(store: ZustandStore, slideId: string): 'saved' | 'saving' {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsub = store.subscribe((state: any, prevState: any) => {
      if (state.slides?.[slideId] === prevState.slides?.[slideId]) return;
      setSaveStatus('saving');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setSaveStatus('saved'), 250);
    });

    return () => {
      unsub();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [store, slideId]);

  return saveStatus;
}
