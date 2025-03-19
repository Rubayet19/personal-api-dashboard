import { useContext } from 'react';
import { RequestBuilderContext } from './request-builder-context';

export function useRequestBuilder() {
  const context = useContext(RequestBuilderContext);
  if (context === undefined) {
    throw new Error('useRequestBuilder must be used within a RequestBuilderProvider');
  }
  return context;
} 