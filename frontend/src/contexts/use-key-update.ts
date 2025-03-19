import { useContext } from 'react';
import { KeyUpdateContext } from './key-update-context';

export function useKeyUpdate() {
  const context = useContext(KeyUpdateContext);
  if (context === undefined) {
    throw new Error('useKeyUpdate must be used within a KeyUpdateProvider');
  }
  return context;
} 