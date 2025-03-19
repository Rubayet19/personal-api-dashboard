import { createContext } from 'react';

// Enhanced context to include loading state
export type KeyUpdateContextType = {
  updateCounter: number;
  triggerUpdate: () => void;
  keysLoading: boolean;
  setKeysLoading: (loading: boolean) => void;
  hasLoadedKeys: boolean;
  setHasLoadedKeys: (loaded: boolean) => void;
};

export const KeyUpdateContext = createContext<KeyUpdateContextType | undefined>(undefined); 