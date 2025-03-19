import { useState, ReactNode } from 'react';
import { KeyUpdateContext } from './key-update-context';

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