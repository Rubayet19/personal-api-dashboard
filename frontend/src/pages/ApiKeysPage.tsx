import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { ApiKeyManager } from "../components/ApiKeyManager";

function ApiKeysPage() {
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
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">API Keys</h1>
            <p className="text-gray-600">
              Manage your API keys for various services. All keys are stored securely and encrypted.
            </p>
          </div>

          {/* API Key Manager Component */}
          <ApiKeyManager />
        </main>
      </div>
    </div>
  );
}

export default ApiKeysPage; 