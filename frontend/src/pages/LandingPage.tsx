import { useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Button } from "../components/ui/button";
import { AuthModal } from "../components/AuthModal";

function LandingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  // Using react-intersection-observer to detect when elements come into view
  const [featuresRef, featuresInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
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

  const heroImageVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        delay: 0.5 
      } 
    }
  };

  const openLoginModal = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const openSignupModal = () => {
    setAuthModalMode('signup');
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <motion.header 
        className="bg-white border-b border-gray-200 py-4"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-2"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              initial={{ rotate: -90 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
              />
            </motion.svg>
            <motion.h1 
              className="text-2xl font-bold text-gray-900"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              API Dashboard
            </motion.h1>
          </motion.div>
          <motion.div 
            className="flex items-center space-x-4"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" onClick={openLoginModal}>
                Log in
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={openSignupModal}>
                Sign up
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <motion.div 
                className="lg:w-1/2 space-y-6"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <motion.h2 
                  className="text-4xl md:text-5xl font-bold text-gray-900"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.7 }}
                >
                  Manage All Your APIs in One Place
                </motion.h2>
                <motion.p 
                  className="text-xl text-gray-600"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.7 }}
                >
                  A personal, open-source dashboard for storing your API keys, testing
                  endpoints, and monitoring rate limits.
                </motion.p>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.7 }}
                >
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    className="inline-block"
                  >
                    <Button size="lg" onClick={openSignupModal}>
                      Get Started
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
              <motion.div 
                className="lg:w-1/2 mt-8 lg:mt-0"
                variants={heroImageVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div 
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 relative overflow-hidden shadow-lg"
                  whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Animated background elements */}
                  <motion.div 
                    className="absolute top-0 right-0 w-32 h-32 bg-blue-400 rounded-full filter blur-3xl opacity-10"
                    animate={{ 
                      x: [0, 10, 0],
                      y: [0, -10, 0],
                    }}
                    transition={{ 
                      duration: 8, 
                      ease: "easeInOut", 
                      repeat: Infinity,
                      repeatType: "reverse" 
                    }}
                  />
                  
                  <motion.div 
                    className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400 rounded-full filter blur-3xl opacity-10"
                    animate={{ 
                      x: [0, -10, 0],
                      y: [0, 10, 0],
                    }}
                    transition={{ 
                      duration: 7, 
                      ease: "easeInOut", 
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: 1
                    }}
                  />
                  
                  {/* Dashboard UI Mockup */}
                  <div className="relative">
                    {/* Dashboard Header */}
                    <motion.div 
                      className="bg-white rounded-t-lg border border-gray-200 p-4 flex items-center justify-between"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="h-6 w-6 rounded bg-blue-500"></div>
                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 rounded-full bg-gray-200"></div>
                        <div className="h-4 w-4 rounded-full bg-gray-200"></div>
                        <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                      </div>
                    </motion.div>
                    
                    {/* Dashboard Stats Grid */}
                    <motion.div 
                      className="grid grid-cols-2 gap-3 bg-gray-50 p-4 border-l border-r border-gray-200"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7, duration: 0.5 }}
                    >
                      <motion.div 
                        className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.9, type: "spring" }}
                      >
                        <div className="text-xs text-gray-500 uppercase mb-1">API Keys</div>
                        <motion.div 
                          className="text-2xl font-bold text-gray-800"
                          animate={{ 
                            scale: [1, 1.05, 1],
                          }}
                          transition={{ 
                            duration: 2,
                            times: [0, 0.5, 1],
                            repeat: Infinity,
                            repeatDelay: 4
                          }}
                        >
                          5
                        </motion.div>
                      </motion.div>
                      
                      <motion.div 
                        className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1.1, type: "spring" }}
                      >
                        <div className="text-xs text-gray-500 uppercase mb-1">API Calls</div>
                        <motion.div 
                          className="text-2xl font-bold text-gray-800"
                          animate={{ 
                            scale: [1, 1.05, 1],
                          }}
                          transition={{ 
                            duration: 2,
                            times: [0, 0.5, 1],
                            repeat: Infinity,
                            repeatDelay: 5,
                            delay: 0.5
                          }}
                        >
                          324
                        </motion.div>
                      </motion.div>
                      
                      <motion.div 
                        className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1.3, type: "spring" }}
                      >
                        <div className="text-xs text-gray-500 uppercase mb-1">Success Rate</div>
                        <div className="text-2xl font-bold text-gray-800">99.2%</div>
                        <motion.div className="h-1 w-full bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <motion.div 
                            className="h-full bg-green-500 rounded-full" 
                            initial={{ width: 0 }}
                            animate={{ width: "99.2%" }}
                            transition={{ delay: 2, duration: 1 }}
                          />
                        </motion.div>
                      </motion.div>
                      
                      <motion.div 
                        className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1.5, type: "spring" }}
                      >
                        <div className="text-xs text-gray-500 uppercase mb-1">Latency</div>
                        <div className="text-2xl font-bold text-gray-800">125ms</div>
                        <motion.div className="h-1 w-full bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <motion.div 
                            className="h-full bg-blue-500 rounded-full" 
                            initial={{ width: 0 }}
                            animate={{ width: "25%" }}
                            transition={{ delay: 2, duration: 1 }}
                          />
                        </motion.div>
                      </motion.div>
                    </motion.div>
                    
                    {/* Rate Limit Section */}
                    <motion.div 
                      className="bg-white p-4 rounded-b-lg border-l border-r border-b border-gray-200"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.7, duration: 0.5 }}
                    >
                      <div className="mb-2 flex justify-between items-center">
                        <div className="text-sm font-medium text-gray-700">Rate Limits</div>
                        <div className="text-xs text-gray-500 px-2 py-1">
                          Last updated: Just now
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <div className="text-gray-600">GitHub API</div>
                            <div className="text-gray-500">4,500/5,000</div>
                          </div>
                          <motion.div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-green-400 rounded-full" 
                              initial={{ width: 0 }}
                              animate={{ width: "90%" }}
                              transition={{ delay: 2.2, duration: 1.5 }}
                            />
                          </motion.div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <div className="text-gray-600">OpenAI API</div>
                            <div className="text-gray-500">182/200</div>
                          </div>
                          <motion.div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-yellow-400 rounded-full" 
                              initial={{ width: 0 }}
                              animate={{ width: "91%" }}
                              transition={{ delay: 2.4, duration: 1.5 }}
                            />
                          </motion.div>
                        </div>
                      </div>
                      
                      {/* Illustrated visualization indicator - not a button */}
                      <motion.div 
                        className="mt-4 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.6 }}
                      >
                        <div className="text-xs text-gray-500 italic">
                          Interactive visualization - not an actual application
                        </div>
                      </motion.div>
                    </motion.div>
                    
                    {/* Code elements floating in the background */}
                    <motion.div 
                      className="absolute -top-3 -right-3 text-xs font-mono text-blue-700 opacity-20 select-none"
                      animate={{ y: [0, -10, 0], opacity: [0.2, 0.3, 0.2] }}
                      transition={{ duration: 5, repeat: Infinity }}
                    >
                      {`{ "data": "visualization" }`}
                    </motion.div>
                    
                    <motion.div 
                      className="absolute -bottom-3 -left-3 text-xs font-mono text-indigo-700 opacity-20 select-none"
                      animate={{ y: [0, 10, 0], opacity: [0.2, 0.3, 0.2] }}
                      transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                    >
                      {`GET /api/stats`}
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section 
          className="py-16 bg-gray-50 overflow-hidden"
          ref={featuresRef}
        >
          <div className="container mx-auto px-4">
            <motion.h2 
              className="text-3xl font-bold text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.7 }}
            >
              Key Features
            </motion.h2>
            <motion.div 
              className="grid md:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate={featuresInView ? "visible" : "hidden"}
            >
              <motion.div 
                className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
                variants={itemVariants}
                whileHover={{ 
                  y: -5, 
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
                }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="h-12 w-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
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
                </motion.div>
                <h3 className="text-xl font-bold mb-2">API Key Management</h3>
                <p className="text-gray-600">
                  Safely store your API keys with encryption and retrieve them
                  whenever you need.
                </p>
              </motion.div>
              <motion.div 
                className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
                variants={itemVariants}
                whileHover={{ 
                  y: -5, 
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
                }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="h-12 w-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </motion.div>
                <h3 className="text-xl font-bold mb-2">Request Testing</h3>
                <p className="text-gray-600">
                  Build and test API requests with a simple, intuitive interface.
                  See formatted responses instantly.
                </p>
              </motion.div>
              <motion.div 
                className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
                variants={itemVariants}
                whileHover={{ 
                  y: -5, 
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
                }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="h-12 w-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
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
                </motion.div>
                <h3 className="text-xl font-bold mb-2">Rate Limit Tracking</h3>
                <p className="text-gray-600">
                  Monitor your API usage and track remaining rate limits to avoid
                  disruptions.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <motion.footer 
        className="bg-gray-900 text-gray-300 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <p>&copy; {new Date().getFullYear()} Personal API Dashboard. Open source project under MIT License.</p>
            </div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <a 
                href="https://github.com/yourusername/personal-api-dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-600 rounded-md hover:bg-gray-800 transition-colors"
              >
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                View on GitHub
              </a>
            </motion.div>
          </div>
        </div>
      </motion.footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        defaultMode={authModalMode}
      />
    </div>
  );
}

export default LandingPage; 