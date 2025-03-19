import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { ApiKeyManager } from "../components/ApiKeyManager";
import { ApiRequestHistory } from "../components/ApiRequestHistory";
import { Link } from "react-router-dom";
import { api, type DashboardStats } from "../lib/api";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useKeyUpdate } from "../contexts/use-key-update";
import { isFreshLogin } from "../lib/auth";

function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { updateCounter, keysLoading, hasLoadedKeys } = useKeyUpdate();
  
  // Setup intersection observer for scroll-based animations
  const [statsRef, statsInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  
  const [sectionsRef, sectionsInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  // Track if this is the first load attempt
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    },
  };

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setError(null);
    try {
      const dashboardStats = await api.getDashboardStats();
      setStats(dashboardStats);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
      // Only show error if it's not the first load attempt
      // and not right after login
      if (!isFirstLoad && !isFreshLogin()) {
        setError("Failed to load dashboard statistics");
      }
    } finally {
      setStatsLoading(false);
      setIsFirstLoad(false); // Mark first load as complete
    }
  }, [isFirstLoad]);

  // Fetch stats on initial load and when API keys are updated
  useEffect(() => {
    // Wait for API keys to load first, then fetch stats
    if (isFirstLoad) {
      // Don't try to fetch stats until keys have been loaded at least once
      // or we've completed several retry attempts
      if (hasLoadedKeys || !keysLoading) {
        const timer = setTimeout(() => {
          fetchStats();
        }, 300); // Small delay to ensure everything is ready
        return () => clearTimeout(timer);
      }
    } else {
      fetchStats();
    }
  }, [updateCounter, isFirstLoad, hasLoadedKeys, keysLoading, fetchStats]);

  // Determine if the full dashboard is in a loading state
  const isLoading = statsLoading || (keysLoading && isFirstLoad);

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
          <motion.div 
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <motion.h1 
                className="text-2xl font-bold text-gray-900 mb-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Dashboard
              </motion.h1>
              <motion.p 
                className="text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Welcome to your personal API dashboard. View your API keys, monitor rate limits, and test API endpoints.
              </motion.p>
            </div>
            <motion.button 
              onClick={fetchStats} 
              disabled={isLoading} 
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              whileHover={{ scale: 1.03, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <ReloadIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? (keysLoading ? 'Loading Keys...' : 'Refreshing...') : 'Refresh Stats'}</span>
            </motion.button>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div 
                className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {error}
                <button 
                  onClick={fetchStats}
                  className="ml-2 text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Try Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Overview */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            ref={statsRef}
            variants={containerVariants}
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
          >
            <motion.div 
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
              variants={itemVariants}
              whileHover={{ 
                y: -5, 
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">TOTAL API KEYS</h3>
                <motion.span 
                  className="p-2 bg-blue-100 text-blue-600 rounded-full"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
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
                </motion.span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {isLoading ? (
                  <span className="inline-block w-10 h-8 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {stats?.total_api_keys || 0}
                  </motion.span>
                )}
              </p>
              <p className="text-sm text-gray-600 mt-1">APIs connected</p>
            </motion.div>

            <motion.div 
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
              variants={itemVariants}
              whileHover={{ 
                y: -5, 
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">API CALLS</h3>
                <motion.span 
                  className="p-2 bg-green-100 text-green-600 rounded-full"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
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
                </motion.span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {isLoading ? (
                  <span className="inline-block w-10 h-8 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: 1,
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ 
                      opacity: { duration: 0.5, delay: 0.2 },
                      scale: { duration: 0.5, times: [0, 0.5, 1] }
                    }}
                  >
                    {stats?.api_calls || 0}
                  </motion.span>
                )}
              </p>
              <p className="text-sm text-gray-600 mt-1">Last 30 days</p>
            </motion.div>

            <motion.div 
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
              variants={itemVariants}
              whileHover={{ 
                y: -5, 
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">SUCCESS RATE</h3>
                <motion.span 
                  className="p-2 bg-green-100 text-green-600 rounded-full"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
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
                </motion.span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {isLoading ? (
                  <span className="inline-block w-16 h-8 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {formatSuccessRate(stats ? stats.success_rate : null)}
                  </motion.span>
                )}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {stats?.api_calls ? 'Request success rate' : 'No data available'}
              </p>
              
              {!isLoading && stats?.success_rate !== null && stats?.success_rate !== undefined && (
                <motion.div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-green-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.success_rate}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </motion.div>
              )}
            </motion.div>

            <motion.div 
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
              variants={itemVariants}
              whileHover={{ 
                y: -5, 
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">AVERAGE LATENCY</h3>
                <motion.span 
                  className="p-2 bg-yellow-100 text-yellow-600 rounded-full"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
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
                </motion.span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {isLoading ? (
                  <span className="inline-block w-16 h-8 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {formatLatency(stats ? stats.average_latency : null)}
                  </motion.span>
                )}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {stats?.average_latency ? 'Response time' : 'No data available'}
              </p>
              
              {!isLoading && stats?.average_latency !== null && stats?.average_latency !== undefined && (
                <motion.div className="mt-2 relative pt-1">
                  <div className="overflow-hidden h-1 text-xs flex rounded bg-gray-200">
                    <motion.div 
                      style={{ 
                        width: `${Math.min(100, (stats.average_latency / 1000) * 100)}%` 
                      }}
                      className={`
                        shadow-none flex flex-col text-center rounded-full
                        ${stats.average_latency < 300 ? 'bg-green-500' : 
                          stats.average_latency < 800 ? 'bg-yellow-500' : 'bg-red-500'}
                      `}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (stats.average_latency / 1000) * 100)}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>

          {/* Placeholder Sections */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            ref={sectionsRef}
            initial={{ opacity: 0, y: 30 }}
            animate={sectionsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            {/* API Keys Section */}
            <motion.div 
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
              whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
                <motion.div whileHover={{ scale: 1.05, x: 3 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    to="/dashboard/api-keys" 
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    View All
                    <motion.svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 ml-1" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1, repeat: Infinity, repeatType: "loop", repeatDelay: 2 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </motion.svg>
                  </Link>
                </motion.div>
              </div>
              
              {/* API Keys preview */}
              <ApiKeyManager />
            </motion.div>

            {/* Rate Limits Section */}
            <motion.div 
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
              whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">API Rate Limits</h2>
                <motion.div whileHover={{ scale: 1.05, x: 3 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    to="/dashboard/rate-limits" 
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    View All
                    <motion.svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 ml-1" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1, repeat: Infinity, repeatType: "loop", repeatDelay: 2 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </motion.svg>
                  </Link>
                </motion.div>
              </div>
              
              {/* Rate Limits will go here */}
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
                </div>
              ) : stats?.rate_limits && Object.keys(stats.rate_limits).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(stats.rate_limits).map(([apiName, limitData], idx) => (
                    <div key={`${apiName}-${idx}`} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700">{apiName}</span>
                        <span className="text-gray-500">
                          {limitData.remaining}/{limitData.limit} requests
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full rounded-full ${
                            (limitData.percentage / 100) > 0.3
                              ? 'bg-green-500'
                              : (limitData.percentage / 100) > 0.1
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${limitData.percentage}%` }}
                          transition={{ duration: 1.5, delay: 0.2 + idx * 0.1 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No rate limit data available</p>
                  <p className="text-sm mt-2">Make API requests to see rate limits</p>
                </div>
              )}
            </motion.div>

            {/* API Request History Section */}
            <motion.div 
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={sectionsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent API Requests</h2>
                <motion.div whileHover={{ scale: 1.05, x: 3 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    to="/dashboard/api-test" 
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    Build Request
                    <motion.svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 ml-1" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1, repeat: Infinity, repeatType: "loop", repeatDelay: 2 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </motion.svg>
                  </Link>
                </motion.div>
              </div>
              
              {/* Request History */}
              <ApiRequestHistory />
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default DashboardPage; 