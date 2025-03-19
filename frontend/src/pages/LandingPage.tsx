import { useState } from "react";
import { Link } from "react-router-dom";
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
                  className="bg-gray-100 p-8 rounded-xl border border-gray-200 relative overflow-hidden"
                  whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Background gradient animation */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-70"
                    animate={{ 
                      backgroundPosition: ["0% 0%", "100% 100%"],
                    }}
                    transition={{ 
                      duration: 15, 
                      ease: "linear", 
                      repeat: Infinity, 
                      repeatType: "reverse" 
                    }}
                    style={{ backgroundSize: "200% 200%" }}
                  />
                  
                  <div className="relative space-y-6">
                    <div className="space-y-2">
                      <motion.div 
                        className="h-4 w-32 bg-gray-300 rounded"
                        initial={{ width: 0 }}
                        animate={{ width: "8rem" }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                      />
                      <motion.div 
                        className="h-10 bg-white border border-gray-300 rounded-md"
                        initial={{ width: "40%" }}
                        animate={{ width: "100%" }}
                        transition={{ delay: 1, duration: 0.5 }}
                      />
                    </div>
                    <div className="space-y-2">
                      <motion.div 
                        className="h-4 w-24 bg-gray-300 rounded"
                        initial={{ width: 0 }}
                        animate={{ width: "6rem" }}
                        transition={{ delay: 1.2, duration: 0.5 }}
                      />
                      <motion.div 
                        className="h-10 bg-white border border-gray-300 rounded-md"
                        initial={{ width: "40%" }}
                        animate={{ width: "100%" }}
                        transition={{ delay: 1.4, duration: 0.5 }}
                      />
                    </div>
                    <motion.div 
                      className="flex justify-end"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.6, duration: 0.5 }}
                    >
                      <div className="h-10 w-24 bg-blue-600 rounded-md" />
                    </motion.div>
                    <motion.div 
                      className="h-40 bg-white border border-gray-300 rounded-md p-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.8, duration: 0.5 }}
                    >
                      <div className="space-y-2">
                        <motion.div 
                          className="h-4 w-full bg-gray-100 rounded"
                          initial={{ width: "20%" }}
                          animate={{ width: "100%" }}
                          transition={{ delay: 2, duration: 0.8 }}
                        />
                        <motion.div 
                          className="h-4 w-3/4 bg-gray-100 rounded"
                          initial={{ width: "20%" }}
                          animate={{ width: "75%" }}
                          transition={{ delay: 2.2, duration: 0.8 }}
                        />
                        <motion.div 
                          className="h-4 w-2/3 bg-gray-100 rounded"
                          initial={{ width: "20%" }}
                          animate={{ width: "66%" }}
                          transition={{ delay: 2.4, duration: 0.8 }}
                        />
                      </div>
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