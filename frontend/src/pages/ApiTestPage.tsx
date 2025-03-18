import { useState } from 'react';
import { ApiRequestForm } from '../components/ApiRequestForm';
import { ApiResponse } from '../components/ApiResponse';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';

interface ApiResponseData {
  status_code: number;
  headers: Record<string, string>;
  body: any;
  time_taken: number;
}

export function ApiTestPage() {
  const [response, setResponse] = useState<ApiResponseData | null>(null);

  const handleResponseReceived = (data: ApiResponseData) => {
    setResponse(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <Navbar />

        {/* Main Content */}
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">API Request Builder</h1>
          
          <div className="grid grid-cols-1 gap-8">
            <ApiRequestForm onResponseReceived={handleResponseReceived} />
            <ApiResponse response={response} />
          </div>
        </main>
      </div>
    </div>
  );
} 