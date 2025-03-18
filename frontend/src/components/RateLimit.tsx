import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { ReloadIcon, InfoCircledIcon, ArrowRightIcon, PlusIcon } from "@radix-ui/react-icons";
import { Skeleton } from "./ui/skeleton";
import { api, type RateLimit as RateLimitType } from "@/lib/api";
import { Link } from "react-router-dom";

interface RateLimitInfo {
  apiName: string;
  remaining: number;
  limit: number;
  resetTime: Date | null;
  lastUpdated: Date;
}

interface RateLimitProps {
  apiKeyId?: string;
}

export function RateLimit({ apiKeyId }: RateLimitProps) {
  const [rateLimits, setRateLimits] = useState<RateLimitInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const fetchRateLimits = async () => {
    setIsLoading(true);
    setError(null);
    setDebugInfo(null);
    
    try {
      // Fetch real rate limit data from the backend
      console.log("Fetching rate limits from API...");
      const rateLimitData = await api.getRateLimits();
      console.log("Rate limit data received:", rateLimitData);
      
      if (rateLimitData && Array.isArray(rateLimitData) && rateLimitData.length > 0) {
        // Convert backend format to component format
        const convertedData: RateLimitInfo[] = rateLimitData.map(limit => ({
          apiName: limit.api_name,
          remaining: limit.remaining,
          limit: limit.limit,
          resetTime: limit.reset_time ? new Date(limit.reset_time) : null,
          lastUpdated: new Date(limit.last_updated)
        }));
        
        setRateLimits(convertedData);
        setDebugInfo(`Found ${convertedData.length} rate limits from the API.`);
      } else {
        // No rate limits found
        setRateLimits([]);
        setDebugInfo("No rate limit data found. Make sure you have API keys stored and used them for requests.");
      }
    } catch (err) {
      console.error("Error fetching rate limits:", err);
      setError("Failed to fetch rate limit data. Please try again later.");
      setRateLimits([]);
      setDebugInfo("API call failed. Check backend logs for more details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRateLimits();
    
    // Set up auto-refresh every 5 minutes
    const intervalId = setInterval(fetchRateLimits, 5 * 60 * 1000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [apiKeyId]);

  const calculatePercentage = (remaining: number, limit: number): number => {
    return Math.round((remaining / limit) * 100);
  };

  const getStatusColor = (percentage: number): string => {
    if (percentage > 50) return "bg-green-500";
    if (percentage > 25) return "bg-yellow-500";
    return "bg-red-500";
  };

  const formatTimeRemaining = (resetTime: Date | null): string => {
    if (!resetTime) return "Unknown";
    
    const now = new Date();
    const diffMs = resetTime.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Reset time passed";
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHrs > 0) {
      return `${diffHrs}h ${diffMins}m`;
    } else {
      return `${diffMins}m`;
    }
  };

  const renderEmptyState = () => (
    <Card className="bg-white">
      <CardContent className="pt-6 pb-8 flex flex-col items-center justify-center text-center">
        <div className="rounded-full bg-gray-100 p-3 mb-4">
          <InfoCircledIcon className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">No Rate Limit Data</h3>
        <p className="text-gray-500 mb-4 max-w-md">
          Rate limits are only tracked when you make API requests using your stored API keys.
        </p>
        <div className="flex gap-3">
          <Link
            to="/dashboard/api-keys" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Manage API Keys
          </Link>
          <Link
            to="/dashboard/request-builder" 
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            Request Builder
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">API Rate Limits</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchRateLimits} 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <ReloadIcon className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-2">
          <InfoCircledIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {debugInfo && (
        <Alert variant="outline" className="mb-2 border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
          <InfoCircledIcon className="h-4 w-4" />
          <AlertDescription className="text-xs font-mono">{debugInfo}</AlertDescription>
        </Alert>
      )}

      {!error && rateLimits.length === 0 && !isLoading && (
        <Alert className="mb-4">
          <InfoCircledIcon className="h-4 w-4" />
          <AlertTitle>How to track rate limits</AlertTitle>
          <AlertDescription>
            <p className="mt-1">
              Rate limits are only tracked when you use stored API keys for requests:
            </p>
            <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm">
              <li>Add your API keys in the API Key Manager page</li>
              <li>Go to API Request Builder</li>
              <li>Make sure to check "Use stored API key" and select your key</li>
              <li>Send the request to an API that returns rate limit headers</li>
              <li>Return to this page and click Refresh</li>
            </ol>
            <p className="mt-2 text-sm italic">
              Note: Rate limit tracking works with GitHub, Twitter, and many other popular APIs that return standard rate limit headers.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-10 w-full" />
                <div className="flex justify-between mt-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {rateLimits.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="space-y-4">
              {rateLimits.map((rateLimit, index) => {
                const percentage = calculatePercentage(
                  rateLimit.remaining,
                  rateLimit.limit
                );
                const statusColor = getStatusColor(percentage);

                return (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <CardTitle>{rateLimit.apiName}</CardTitle>
                        </div>
                        <Badge variant={percentage < 25 ? "destructive" : "secondary"}>
                          {percentage}% Remaining
                        </Badge>
                      </div>
                      <CardDescription>
                        Last updated: {rateLimit.lastUpdated.toLocaleTimeString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full bg-secondary h-4 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${statusColor} transition-all duration-500 ease-in-out`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-2 text-sm">
                        <span>
                          {rateLimit.remaining} / {rateLimit.limit} requests left
                        </span>
                        <span>
                          Reset in: {formatTimeRemaining(rateLimit.resetTime)}
                        </span>
                      </div>
                      
                      {/* Warning alerts when approaching rate limits */}
                      {percentage <= 10 ? (
                        <Alert variant="destructive" className="mt-3">
                          <AlertTitle className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Critical Rate Limit Warning
                          </AlertTitle>
                          <AlertDescription>
                            You have only {rateLimit.remaining} requests left ({percentage}%). Consider spacing out your requests until reset.
                          </AlertDescription>
                        </Alert>
                      ) : percentage <= 25 ? (
                        <Alert variant="warning" className="mt-3 border-yellow-200 bg-yellow-50">
                          <AlertTitle className="flex items-center text-yellow-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Rate Limit Warning
                          </AlertTitle>
                          <AlertDescription className="text-yellow-800">
                            You're approaching the rate limit for {rateLimit.apiName}. {rateLimit.remaining} of {rateLimit.limit} requests remaining.
                          </AlertDescription>
                        </Alert>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
} 