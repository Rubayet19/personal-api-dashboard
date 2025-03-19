import React, { createContext, useContext, useState, ReactNode } from 'react';

// Enhanced context to include loading state
type KeyUpdateContextType = {
  updateCounter: number;
  triggerUpdate: () => void;
  keysLoading: boolean;
  setKeysLoading: (loading: boolean) => void;
  hasLoadedKeys: boolean;
  setHasLoadedKeys: (loaded: boolean) => void;
};

const KeyUpdateContext = createContext<KeyUpdateContextType | undefined>(undefined);

export function KeyUpdateProvider({ children }: { children: ReactNode }) {
  const [updateCounter, setUpdateCounter] = useState<number>(0);
  const [keysLoading, setKeysLoading] = useState<boolean>(true);
  const [hasLoadedKeys, setHasLoadedKeys] = useState<boolean>(false);

  const triggerUpdate = () => {
    setUpdateCounter(prev => prev + 1);
  };

  return (
    <KeyUpdateContext.Provider 
      value={{ 
        updateCounter, 
        triggerUpdate, 
        keysLoading, 
        setKeysLoading,
        hasLoadedKeys,
        setHasLoadedKeys
      }}
    >
      {children}
    </KeyUpdateContext.Provider>
  );
}

export function useKeyUpdate() {
  const context = useContext(KeyUpdateContext);
  if (context === undefined) {
    throw new Error('useKeyUpdate must be used within a KeyUpdateProvider');
  }
  return context;
} 