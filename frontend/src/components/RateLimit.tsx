import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { ReloadIcon, InfoCircledIcon, ArrowRightIcon } from "@radix-ui/react-icons";
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
        setDebugInfo("No rate limit data found. Try making API requests with your stored API keys.");
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
          Rate limit data is collected when you make API requests through the Request Builder using your stored API keys.
        </p>
        <Link
          to="/dashboard/request-builder" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
        >
          Go to Request Builder
          <ArrowRightIcon className="ml-2 h-4 w-4" />
        </Link>
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
          <AlertTitle>How to see rate limits</AlertTitle>
          <AlertDescription>
            <p className="mt-1">
              To see your API rate limits:
            </p>
            <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm">
              <li>Go to API Request Builder</li>
              <li>Make a request to an API endpoint (like <code className="text-xs bg-gray-100 rounded p-0.5">https://api.github.com/user</code>)</li>
              <li>Check "Use stored API key" and select your API key</li>
              <li>Send the request</li>
              <li>Return to this page and click Refresh</li>
            </ol>
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