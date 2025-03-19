import React, { createContext, useContext, useState, ReactNode } from 'react';

// Simple counter to trigger updates
type KeyUpdateContextType = {
  updateCounter: number;
  triggerUpdate: () => void;
};

const KeyUpdateContext = createContext<KeyUpdateContextType | undefined>(undefined);

export function KeyUpdateProvider({ children }: { children: ReactNode }) {
  const [updateCounter, setUpdateCounter] = useState<number>(0);

  const triggerUpdate = () => {
    setUpdateCounter(prev => prev + 1);
  };

  return (
    <KeyUpdateContext.Provider value={{ updateCounter, triggerUpdate }}>
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