import { ApiRequestForm } from '../components/ApiRequestForm';
import { ApiResponse } from '../components/ApiResponse';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { RequestBuilderProvider } from '../contexts/RequestBuilderContext';

export function ApiTestPage() {
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
          
          <RequestBuilderProvider>
            <div className="grid grid-cols-1 gap-8">
              <ApiRequestForm />
              <ApiResponse />
            </div>
          </RequestBuilderProvider>
        </main>
      </div>
    </div>
  );
} 