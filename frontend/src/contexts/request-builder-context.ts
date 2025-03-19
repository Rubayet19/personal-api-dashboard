import { createContext } from 'react';

// Define types
export interface Header {
  key: string;
  value: string;
  id: string;
}

export interface ApiResponseData {
  status_code: number;
  headers: Record<string, string>;
  body: unknown;
  time_taken: number;
}

// State interface
export interface RequestBuilderState {
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
export interface RequestBuilderContextType {
  state: RequestBuilderState;
  setState: (state: Partial<RequestBuilderState>) => void;
  resetState: () => void;
}

// Initial state
export const initialState: RequestBuilderState = {
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
export const RequestBuilderContext = createContext<RequestBuilderContextType | undefined>(undefined); 