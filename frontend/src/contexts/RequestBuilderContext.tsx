import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define types
interface Header {
  key: string;
  value: string;
  id: string;
}

export interface ApiResponseData {
  status_code: number;
  headers: Record<string, string>;
  body: any;
  time_taken: number;
}

// State interface
interface RequestBuilderState {
  url: string;
  method: string;
  headers: Header[];
  body: string;
  useApiKey: boolean;
  selectedApiKeyId: string;
  response: ApiResponseData | null;
  activeTab: string;
}

// Context interface
interface RequestBuilderContextType {
  state: RequestBuilderState;
  setState: (state: Partial<RequestBuilderState>) => void;
  resetState: () => void;
}

// Initial state
const initialState: RequestBuilderState = {
  url: '',
  method: 'GET',
  headers: [{ key: '', value: '', id: Date.now().toString() }],
  body: '',
  useApiKey: false,
  selectedApiKeyId: '',
  response: null,
  activeTab: 'headers',
};

// Create context
const RequestBuilderContext = createContext<RequestBuilderContextType | undefined>(undefined);

// Provider component
export function RequestBuilderProvider({ children }: { children: ReactNode }) {
  const [state, setFullState] = useState<RequestBuilderState>(() => {
    // Try to load from localStorage
    const savedState = localStorage.getItem('requestBuilderState');
    if (savedState) {
      try {
        return JSON.parse(savedState);
      } catch (e) {
        console.error('Failed to parse saved request builder state:', e);
      }
    }
    return initialState;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('requestBuilderState', JSON.stringify(state));
  }, [state]);

  // Update state
  const setState = (newState: Partial<RequestBuilderState>) => {
    setFullState((prevState) => ({ ...prevState, ...newState }));
  };

  // Reset state
  const resetState = () => {
    setFullState(initialState);
    localStorage.removeItem('requestBuilderState');
  };

  return (
    <RequestBuilderContext.Provider value={{ state, setState, resetState }}>
      {children}
    </RequestBuilderContext.Provider>
  );
}

// Custom hook to use the context
export function useRequestBuilder() {
  const context = useContext(RequestBuilderContext);
  if (context === undefined) {
    throw new Error('useRequestBuilder must be used within a RequestBuilderProvider');
  }
  return context;
} 