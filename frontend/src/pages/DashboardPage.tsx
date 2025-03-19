import { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { ApiKeyManager } from "../components/ApiKeyManager";
import { RateLimit } from "../components/RateLimit";
import { ApiRequestHistory } from "../components/ApiRequestHistory";
import { Link } from "react-router-dom";
import { api, type DashboardStats } from "../lib/api";
import { ReloadIcon } from "@radix-ui/react-icons";

function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dashboardStats = await api.getDashboardStats();
      setStats(dashboardStats);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
      setError("Failed to load dashboard statistics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Format latency in milliseconds to a readable string
  const formatLatency = (latency: number | null): string => {
    if (latency === null) return "--";
    if (latency < 1) return "<1ms";
    if (latency < 1000) return `${Math.round(latency)}ms`;
    return `${(latency / 1000).toFixed(2)}s`;
  };

  // Format success rate as a percentage with 2 decimal places
  const formatSuccessRate = (rate: number | null): string => {
    if (rate === null) return "--";
    return `${rate.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <Navbar />

        {/* Main Dashboard Content */}
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600">
                Welcome to your personal API dashboard. View your API keys, monitor rate limits, and test API endpoints.
              </p>
            </div>
            <button 
              onClick={fetchStats} 
              disabled={isLoading} 
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ReloadIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Refreshing...' : 'Refresh Stats'}</span>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
              {error}
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">TOTAL API KEYS</h3>
                <span className="p-2 bg-blue-100 text-blue-600 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {isLoading ? (
                  <span className="inline-block w-10 h-8 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  stats?.total_api_keys || 0
                )}
              </p>
              <p className="text-sm text-gray-600 mt-1">APIs connected</p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">API CALLS</h3>
                <span className="p-2 bg-green-100 text-green-600 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {isLoading ? (
                  <span className="inline-block w-10 h-8 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  stats?.api_calls || 0
                )}
              </p>
              <p className="text-sm text-gray-600 mt-1">Last 30 days</p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">SUCCESS RATE</h3>
                <span className="p-2 bg-green-100 text-green-600 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {isLoading ? (
                  <span className="inline-block w-16 h-8 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  formatSuccessRate(stats?.success_rate)
                )}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {stats?.api_calls ? 'Request success rate' : 'No data available'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">AVERAGE LATENCY</h3>
                <span className="p-2 bg-yellow-100 text-yellow-600 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {isLoading ? (
                  <span className="inline-block w-16 h-8 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  formatLatency(stats?.average_latency)
                )}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {stats?.average_latency ? 'Response time' : 'No data available'}
              </p>
            </div>
          </div>

          {/* Placeholder Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* API Keys Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
                <Link 
                  to="/dashboard/api-keys" 
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  View All
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 ml-1" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              
              {/* API Keys preview */}
              <ApiKeyManager />
            </div>

            {/* Rate Limits Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">API Rate Limits</h2>
                <Link 
                  to="/dashboard/rate-limits" 
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  View All
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 ml-1" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              
              {/* Rate Limit data */}
              {stats && Object.keys(stats.rate_limits).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(stats.rate_limits).slice(0, 2).map(([apiName, limitData]) => (
                    <div key={apiName} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">{apiName}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          limitData.percentage > 50 ? 'bg-green-100 text-green-800' : 
                          limitData.percentage > 20 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {limitData.percentage}% remaining
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full">
                        <div 
                          className={`h-full rounded-full ${
                            limitData.percentage > 50 ? 'bg-green-500' : 
                            limitData.percentage > 20 ? 'bg-yellow-500' : 
                            'bg-red-500'
                          }`}
                          style={{ width: `${limitData.percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>{limitData.remaining} / {limitData.limit} requests left</span>
                      </div>
                    </div>
                  ))}
                  
                  {Object.keys(stats.rate_limits).length > 2 && (
                    <Link 
                      to="/dashboard/rate-limits" 
                      className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      View {Object.keys(stats.rate_limits).length - 2} more...
                    </Link>
                  )}
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-gray-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <p className="text-gray-600 mb-2">No rate limit data available</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Add API keys and make requests to see rate limit information
                  </p>
                  <Link
                    to="/dashboard/rate-limits" 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Rate Limits
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* API Request History Section */}
          <div className="mt-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">API Request History</h2>
              <Link 
                to="/dashboard/request-builder" 
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                Build New Request
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 ml-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            
            <ApiRequestHistory />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardPage; 